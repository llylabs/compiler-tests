// async generateMetadata that uses try/catch around await
async function fetchTitle() {
  return Promise.resolve("From-Async");
}

export async function generateMetadata() {
  var title;
  try {
    title = await fetchTitle();
  } catch (e) {
    title = "Fallback";
  }
  return { title: title };
}

export default function MetaTcPage() {
  return <div><h1>Async Meta TC</h1><p>Look at the title element.</p></div>;
}
