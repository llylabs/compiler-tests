// J-02 fixture: finally body runs exactly once per throw caught.
// Counter incremented in finally; after one try{throw} catch{} finally{++}
// flow, counter should be 1 — not 2 (duplication bug would show 2 if
// finally somehow ran twice).
export default async function TryFinallyOnce() {
  var counter = 0;
  try {
    try {
      throw new Error("boom");
    } catch (e) {
      // swallowed
    } finally {
      counter = counter + 1;
    }
  } catch (e) {
    // outer catch — shouldn't fire
  }
  return (
    <div>
      <h1>try-finally-once</h1>
      <p>counter={counter}</p>
    </div>
  );
}
