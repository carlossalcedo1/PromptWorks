/**
 * Line-level diff (LCS) for the score screen's Diff tab: your prompt against
 * the reference prompt. Small enough to keep local; no dependency needed.
 */
export function diffLines(a = "", b = "") {
  const A = a.replace(/\r/g, "").split("\n");
  const B = b.replace(/\r/g, "").split("\n");

  // LCS table
  const m = A.length;
  const n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        A[i].trim() === B[j].trim()
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (A[i].trim() === B[j].trim()) {
      out.push({ type: "same", text: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "removed", text: A[i] });
      i++;
    } else {
      out.push({ type: "added", text: B[j] });
      j++;
    }
  }
  while (i < m) out.push({ type: "removed", text: A[i++] });
  while (j < n) out.push({ type: "added", text: B[j++] });

  return out;
}
