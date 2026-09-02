"""
Load data/tracks.json and data/scenarios/*.json into Postgres.

The JSON files are the reviewable source of truth; this table is what the app
actually queries. Re-running the script after editing a file is safe: every
row is upserted by `slug`, so a second run updates in place rather than
inserting duplicates or erroring.

Run from the repo root, with DATABASE_URL set:

    python scripts/seed_scenarios.py
    python scripts/seed_scenarios.py --dry-run    # validate the files only

--dry-run parses and validates every file without opening a connection, which
is what CI can run to catch a malformed scenario before it reaches a database.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

load_dotenv()

from sqlalchemy import select  # noqa: E402
from sqlalchemy.dialects.postgresql import insert  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from backend.db.base import get_session_factory  # noqa: E402
from backend.db.models import DIMENSIONS, Scenario, Track  # noqa: E402

DATA_DIR = REPO_ROOT / "data"
TRACKS_FILE = DATA_DIR / "tracks.json"
SCENARIOS_DIR = DATA_DIR / "scenarios"

TRACK_FIELDS = {"slug", "title", "description", "level"}
TRACK_REQUIRED = {"slug", "title"}

SCENARIO_FIELDS = {
    "slug",
    "title",
    "track",
    "difficulty",
    "brief",
    "context",
    "constraints",
    "output_format",
    "role_and_audience",
    "examples",
    "reference_prompt",
    "rubric_weights",
    "calibration_examples",
}
SCENARIO_REQUIRED = {"slug", "title", "brief"}


class SeedError(Exception):
    """A data file is malformed. Raised before anything is written."""


# ---------------------------------------------------------------------------
# Loading and validation
# ---------------------------------------------------------------------------


def _load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SeedError(f"{path.name}: not valid JSON — {exc}") from exc


def load_tracks() -> list[dict[str, Any]]:
    if not TRACKS_FILE.exists():
        raise SeedError(f"missing {TRACKS_FILE}")

    raw = _load_json(TRACKS_FILE)
    if not isinstance(raw, list):
        raise SeedError("tracks.json must contain a JSON array of track objects")

    seen: set[str] = set()
    tracks = []
    for i, item in enumerate(raw):
        where = f"tracks.json[{i}]"
        if not isinstance(item, dict):
            raise SeedError(f"{where}: expected an object")

        unknown = set(item) - TRACK_FIELDS
        if unknown:
            raise SeedError(f"{where}: unknown field(s) {sorted(unknown)}")
        missing = TRACK_REQUIRED - set(item)
        if missing:
            raise SeedError(f"{where}: missing required field(s) {sorted(missing)}")

        slug = item["slug"]
        if slug in seen:
            raise SeedError(f"{where}: duplicate track slug {slug!r}")
        seen.add(slug)

        tracks.append(
            {
                "slug": slug,
                "title": item["title"],
                "description": item.get("description", ""),
                "level": item.get("level", ""),
            }
        )

    return tracks


def load_scenarios(known_tracks: set[str]) -> list[dict[str, Any]]:
    if not SCENARIOS_DIR.is_dir():
        raise SeedError(f"missing {SCENARIOS_DIR}")

    paths = sorted(SCENARIOS_DIR.glob("*.json"))
    if not paths:
        raise SeedError(f"no scenario files found in {SCENARIOS_DIR}")

    seen: set[str] = set()
    scenarios = []

    for path in paths:
        item = _load_json(path)
        if not isinstance(item, dict):
            raise SeedError(f"{path.name}: expected a JSON object")

        unknown = set(item) - SCENARIO_FIELDS
        if unknown:
            raise SeedError(f"{path.name}: unknown field(s) {sorted(unknown)}")
        missing = SCENARIO_REQUIRED - set(item)
        if missing:
            raise SeedError(f"{path.name}: missing required field(s) {sorted(missing)}")

        slug = item["slug"]
        # One scenario per file, named after its slug — so a reviewer can find
        # the file from a slug in a stack trace without grepping.
        if slug != path.stem:
            raise SeedError(
                f"{path.name}: slug {slug!r} does not match the filename "
                f"(expected {path.stem!r})"
            )
        if slug in seen:
            raise SeedError(f"{path.name}: duplicate scenario slug {slug!r}")
        seen.add(slug)

        track = item.get("track")
        if track and track not in known_tracks:
            raise SeedError(
                f"{path.name}: track {track!r} is not in tracks.json "
                f"(known: {sorted(known_tracks)})"
            )

        for list_field in ("constraints", "examples"):
            value = item.get(list_field, [])
            if not isinstance(value, list) or not all(
                isinstance(v, str) for v in value
            ):
                raise SeedError(f"{path.name}: {list_field} must be a list of strings")

        weights = item.get("rubric_weights")
        if weights is not None:
            if not isinstance(weights, dict):
                raise SeedError(f"{path.name}: rubric_weights must be an object")
            bad = set(weights) - set(DIMENSIONS)
            if bad:
                raise SeedError(
                    f"{path.name}: rubric_weights has unknown dimension(s) "
                    f"{sorted(bad)} — valid keys are {list(DIMENSIONS)}"
                )
            if not all(isinstance(v, (int, float)) for v in weights.values()):
                raise SeedError(f"{path.name}: rubric_weights values must be numbers")

        calibration = item.get("calibration_examples", [])
        if not isinstance(calibration, list):
            raise SeedError(f"{path.name}: calibration_examples must be a list")
        for j, ex in enumerate(calibration):
            if not isinstance(ex, dict) or "prompt" not in ex or "scores" not in ex:
                raise SeedError(
                    f"{path.name}: calibration_examples[{j}] needs 'prompt' and 'scores'"
                )
            ex_missing = set(DIMENSIONS) - set(ex["scores"])
            if ex_missing:
                raise SeedError(
                    f"{path.name}: calibration_examples[{j}].scores is missing "
                    f"{sorted(ex_missing)} — a calibration example must score all six"
                )

        # Unspecified weights mean equal weight on all six dimensions.
        resolved_weights = {dim: 1.0 for dim in DIMENSIONS}
        if weights:
            resolved_weights.update({k: float(v) for k, v in weights.items()})

        scenarios.append(
            {
                "slug": slug,
                "title": item["title"],
                "track": track,
                "difficulty": item.get("difficulty", ""),
                "brief": item["brief"],
                "context": item.get("context", ""),
                "constraints": item.get("constraints", []),
                "output_format": item.get("output_format", ""),
                "role_and_audience": item.get("role_and_audience", ""),
                "examples": item.get("examples", []),
                "reference_prompt": item.get("reference_prompt", ""),
                "rubric_weights": resolved_weights,
                "calibration_examples": calibration,
            }
        )

    return scenarios


# ---------------------------------------------------------------------------
# Upserting
# ---------------------------------------------------------------------------


def upsert_tracks(session: Session, tracks: list[dict[str, Any]]) -> dict[str, Any]:
    """Upsert every track by slug. Returns {slug: id} for the scenario pass."""
    for row in tracks:
        stmt = insert(Track).values(**row)
        stmt = stmt.on_conflict_do_update(
            index_elements=[Track.slug],
            set_={
                "title": stmt.excluded.title,
                "description": stmt.excluded.description,
                "level": stmt.excluded.level,
            },
        )
        session.execute(stmt)

    session.flush()
    return {
        slug: track_id
        for slug, track_id in session.execute(select(Track.slug, Track.id)).all()
    }


def upsert_scenarios(
    session: Session, scenarios: list[dict[str, Any]], track_ids: dict[str, Any]
) -> None:
    for row in scenarios:
        track = row.pop("track")
        row["track_id"] = track_ids[track] if track else None

        stmt = insert(Scenario).values(**row)
        stmt = stmt.on_conflict_do_update(
            index_elements=[Scenario.slug],
            set_={
                # Everything except id, slug, created_by and created_at: the
                # files own the content, the database owns the identity. Not
                # overwriting created_by matters — re-seeding must not wipe
                # the author of an org-authored scenario.
                col: getattr(stmt.excluded, col)
                for col in (
                    "title",
                    "track_id",
                    "difficulty",
                    "brief",
                    "context",
                    "constraints",
                    "output_format",
                    "role_and_audience",
                    "examples",
                    "reference_prompt",
                    "rubric_weights",
                    "calibration_examples",
                )
            },
        )
        session.execute(stmt)

    session.flush()


def seed(session: Session) -> tuple[int, int]:
    """Validate the data files and upsert them. Caller owns the commit."""
    tracks = load_tracks()
    scenarios = load_scenarios({t["slug"] for t in tracks})

    track_ids = upsert_tracks(session, tracks)
    upsert_scenarios(session, scenarios, track_ids)

    return len(tracks), len(scenarios)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="validate the data files without connecting to the database",
    )
    args = parser.parse_args()

    try:
        if args.dry_run:
            tracks = load_tracks()
            scenarios = load_scenarios({t["slug"] for t in tracks})
            print(
                f"OK: {len(tracks)} tracks and {len(scenarios)} scenarios "
                f"are valid. Nothing was written (--dry-run)."
            )
            return 0

        with get_session_factory()() as session:
            n_tracks, n_scenarios = seed(session)
            session.commit()

        print(f"Seeded {n_tracks} tracks and {n_scenarios} scenarios.")
        return 0
    except SeedError as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
