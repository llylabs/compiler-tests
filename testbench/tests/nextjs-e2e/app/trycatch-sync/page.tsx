export default async function TryCatchSyncPage({ searchParams }) {
  const sp = (await searchParams) || {};
  var result;
  // Sync prefix branch (J-01 baseline): sync try/catch around sync throw.
  try {
    if (sp.fail === "yes") {
      throw new Error("intentional");
    }
    result = "ok";
  } catch (e) {
    result = "caught: " + e.message;
  } finally {
    // finally always runs
  }

  // J-01 case: async fn with try-body containing a SYNC throw BEFORE the
  // first await. Without Stage 1.4 the BIR `Throw` escapes the wrapper
  // (uncaught). With Stage 1.4 the throw is caught by the BIR-level
  // try-region installed around the prefix, and routes to catch-body +
  // finally + outer_tail.
  const j01 = await (async () => {
    try {
      throw new Error("boom");
      await Promise.resolve();
    } catch (e) {
      return e.message;
    }
  })();

  return (
    <div>
      <h1>Try-Catch-Sync</h1>
      <p>Result: {result}</p>
      <p>J01: caught: {j01}</p>
    </div>
  );
}
