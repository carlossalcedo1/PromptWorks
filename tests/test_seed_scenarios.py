"""
Tests for scripts/seed_scenarios.py.

Two halves:

  * Validation — pure file parsing, no database. These also run against the
    real data/ directory, so a malformed scenario file fails the suite rather
    than surfacing as a confusing grade later.
  * Idempotency — needs Postgres, and skips without it. This is the property
    the whole "JSON files are the source of truth" approach rests on: editing
    a file and re-running the script must update rows in place, not duplicate
    them.

Run with: pytest tests/test_seed_scenarios.py -v
"""

from __future__ import annotations

import json
import uuid

import pytest
from sqlalchemy import func, select

from backend.db.models import DIMENSIONS, Scenario, Track
from scripts.seed_scenarios import (
    SeedError,
    load_scenarios,
    load_tracks,
    seed,
)
import scripts.seed_scenarios as seeder


# ---------------------------------------------------------------------------
# The real data files
# ---------------------------------------------------------------------------


def test_real_data_files_are_valid():
    tracks = load_tracks()
    scenarios = load_scenarios({t["slug"] for t in tracks})

    assert len(tracks) == 12, "expected the 12 Stage 1 tracks"
    assert len(scenarios) == 10, "expected the 10 Stage 1 scenarios"


def test_every_scenario_names_a_known_track():
    tracks = load_tracks()
    known = {t["slug"] for t in tracks}
    for scenario in load_scenarios(known):
        assert scenario["track"] in known


def test_every_scenario_has_the_fields_the_grader_reads():
    tracks = load_tracks()
    for scenario in load_scenarios({t["slug"] for t in tracks}):
        where = scenario["slug"]
        assert scenario["brief"].strip(), f"{where}: empty brief"
        assert scenario["context"].strip(), f"{where}: empty context"
        assert scenario["constraints"], f"{where}: no constraints"
        assert scenario["output_format"].strip(), f"{where}: no output_format"
        assert scenario["role_and_audience"].strip(), f"{where}: no role_and_audience"
        assert scenario["reference_prompt"].strip(), f"{where}: no reference_prompt"


def test_rubric_weights_default_to_equal():
    tracks = load_tracks()
    for scenario in load_scenarios({t["slug"] for t in tracks}):
        assert set(scenario["rubric_weights"]) == set(DIMENSIONS)


def test_no_fabricated_calibration_examples():
    # llm_grader is explicit that calibration scores must be real, reviewed
    # ones. Shipping invented scores would silently miscalibrate the judge,
    # so the ported files carry none at all.
    tracks = load_tracks()
    for scenario in load_scenarios({t["slug"] for t in tracks}):
        assert scenario["calibration_examples"] == []


def test_scenarios_can_build_a_grader_scenario():
    """The DB row and llm_grader.Scenario are meant to stay in lockstep."""
    from backend.llm_grader import Scenario as GraderScenario

    tracks = load_tracks()
    for data in load_scenarios({t["slug"] for t in tracks}):
        grader_scenario = GraderScenario(
            id=data["slug"],
            brief=data["brief"],
            context=data["context"],
            constraints=data["constraints"],
            output_format=data["output_format"],
            role_and_audience=data["role_and_audience"],
            examples=data["examples"],
            reference_prompt=data["reference_prompt"],
            rubric_weights=dict(data["rubric_weights"]),
        )
        assert set(grader_scenario.rubric_weights) == set(DIMENSIONS)


# ---------------------------------------------------------------------------
# Validation failures
# ---------------------------------------------------------------------------


@pytest.fixture
def fake_data_dir(tmp_path, monkeypatch):
    """Point the loader at a throwaway data directory."""
    scenarios_dir = tmp_path / "scenarios"
    scenarios_dir.mkdir()
    monkeypatch.setattr(seeder, "DATA_DIR", tmp_path)
    monkeypatch.setattr(seeder, "TRACKS_FILE", tmp_path / "tracks.json")
    monkeypatch.setattr(seeder, "SCENARIOS_DIR", scenarios_dir)

    def write_tracks(tracks):
        (tmp_path / "tracks.json").write_text(json.dumps(tracks), encoding="utf-8")

    def write_scenario(name, doc):
        (scenarios_dir / f"{name}.json").write_text(json.dumps(doc), encoding="utf-8")

    return write_tracks, write_scenario


VALID_SCENARIO = {
    "slug": "a-scenario",
    "title": "A scenario",
    "track": "a-track",
    "brief": "Do the thing.",
}


def test_missing_tracks_file_is_an_error(fake_data_dir):
    with pytest.raises(SeedError, match="missing"):
        load_tracks()


def test_malformed_json_is_an_error(fake_data_dir, tmp_path):
    (tmp_path / "tracks.json").write_text("{not json", encoding="utf-8")
    with pytest.raises(SeedError, match="not valid JSON"):
        load_tracks()


def test_duplicate_track_slug_is_an_error(fake_data_dir):
    write_tracks, _ = fake_data_dir
    write_tracks([{"slug": "a", "title": "A"}, {"slug": "a", "title": "B"}])
    with pytest.raises(SeedError, match="duplicate"):
        load_tracks()


def test_unknown_track_field_is_an_error(fake_data_dir):
    write_tracks, _ = fake_data_dir
    write_tracks([{"slug": "a", "title": "A", "colour": "blue"}])
    with pytest.raises(SeedError, match="unknown field"):
        load_tracks()


def test_scenario_slug_must_match_its_filename(fake_data_dir):
    write_tracks, write_scenario = fake_data_dir
    write_tracks([{"slug": "a-track", "title": "A"}])
    write_scenario("different-name", VALID_SCENARIO)

    with pytest.raises(SeedError, match="does not match the filename"):
        load_scenarios({"a-track"})


def test_scenario_with_an_unknown_track_is_an_error(fake_data_dir):
    write_tracks, write_scenario = fake_data_dir
    write_tracks([{"slug": "a-track", "title": "A"}])
    write_scenario("a-scenario", {**VALID_SCENARIO, "track": "nope"})

    with pytest.raises(SeedError, match="not in tracks.json"):
        load_scenarios({"a-track"})


def test_scenario_missing_a_required_field_is_an_error(fake_data_dir):
    write_tracks, write_scenario = fake_data_dir
    write_tracks([{"slug": "a-track", "title": "A"}])
    write_scenario("a-scenario", {"slug": "a-scenario", "title": "A"})

    with pytest.raises(SeedError, match="missing required field"):
        load_scenarios({"a-track"})


def test_unknown_rubric_dimension_is_an_error(fake_data_dir):
    write_tracks, write_scenario = fake_data_dir
    write_tracks([{"slug": "a-track", "title": "A"}])
    write_scenario(
        "a-scenario", {**VALID_SCENARIO, "rubric_weights": {"tone": 2.0}}
    )

    with pytest.raises(SeedError, match="unknown dimension"):
        load_scenarios({"a-track"})


def test_partial_rubric_weights_are_filled_in(fake_data_dir):
    write_tracks, write_scenario = fake_data_dir
    write_tracks([{"slug": "a-track", "title": "A"}])
    write_scenario(
        "a-scenario", {**VALID_SCENARIO, "rubric_weights": {"constraints": 2.0}}
    )

    scenario = load_scenarios({"a-track"})[0]
    assert scenario["rubric_weights"]["constraints"] == 2.0
    assert scenario["rubric_weights"]["examples"] == 1.0


def test_constraints_must_be_strings(fake_data_dir):
    write_tracks, write_scenario = fake_data_dir
    write_tracks([{"slug": "a-track", "title": "A"}])
    write_scenario(
        "a-scenario", {**VALID_SCENARIO, "constraints": [{"label": "nope"}]}
    )

    with pytest.raises(SeedError, match="list of strings"):
        load_scenarios({"a-track"})


def test_calibration_example_must_score_all_six_dimensions(fake_data_dir):
    write_tracks, write_scenario = fake_data_dir
    write_tracks([{"slug": "a-track", "title": "A"}])
    write_scenario(
        "a-scenario",
        {
            **VALID_SCENARIO,
            "calibration_examples": [
                {"prompt": "p", "scores": {"task_clarity": 3}}
            ],
        },
    )

    with pytest.raises(SeedError, match="missing"):
        load_scenarios({"a-track"})


# ---------------------------------------------------------------------------
# Upsert idempotency — needs a database
# ---------------------------------------------------------------------------


def test_seeding_twice_does_not_duplicate_rows(db_session):
    seed(db_session)
    tracks_after_first = db_session.scalar(select(func.count()).select_from(Track))
    scenarios_after_first = db_session.scalar(
        select(func.count()).select_from(Scenario)
    )

    seed(db_session)
    assert db_session.scalar(select(func.count()).select_from(Track)) == tracks_after_first
    assert (
        db_session.scalar(select(func.count()).select_from(Scenario))
        == scenarios_after_first
    )


def test_seeding_updates_an_edited_row_in_place(db_session):
    seed(db_session)

    scenario = db_session.scalars(
        select(Scenario).where(Scenario.slug == "denial-explanation-email")
    ).one()
    original_id = scenario.id

    # Simulate drift: something changed the row out from under the files.
    scenario.title = "Edited out of band"
    scenario.constraints = ["wrong"]
    db_session.flush()

    seed(db_session)
    db_session.expunge_all()

    reloaded = db_session.scalars(
        select(Scenario).where(Scenario.slug == "denial-explanation-email")
    ).one()

    # Same row (the id is stable), file contents restored.
    assert reloaded.id == original_id
    assert reloaded.title == "Denial explanation email"
    assert "Empathetic, plain english" in reloaded.constraints


def test_seeding_links_scenarios_to_their_tracks(db_session):
    seed(db_session)

    scenario = db_session.scalars(
        select(Scenario).where(Scenario.slug == "denial-explanation-email")
    ).one()
    assert scenario.track is not None
    assert scenario.track.slug == "service-claims"


def test_seeding_preserves_created_by(db_session):
    """Re-seeding must not wipe the author of an org-authored scenario."""
    from backend.db.models import User

    seed(db_session)

    author = User(email=f"author-{uuid.uuid4().hex[:8]}@example.com")
    db_session.add(author)
    db_session.flush()

    scenario = db_session.scalars(
        select(Scenario).where(Scenario.slug == "escalation-note")
    ).one()
    scenario.created_by = author.id
    db_session.flush()

    seed(db_session)
    db_session.expunge_all()

    reloaded = db_session.scalars(
        select(Scenario).where(Scenario.slug == "escalation-note")
    ).one()
    assert reloaded.created_by == author.id


def test_seeded_scenarios_round_trip_their_jsonb(db_session):
    seed(db_session)
    db_session.expunge_all()

    scenario = db_session.scalars(
        select(Scenario).where(Scenario.slug == "denial-explanation-email")
    ).one()

    assert isinstance(scenario.constraints, list)
    assert len(scenario.constraints) == 5
    assert set(scenario.rubric_weights) == set(DIMENSIONS)
    assert "Section 4.2" in scenario.context
