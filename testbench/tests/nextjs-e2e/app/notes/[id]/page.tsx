// Dynamic route with async data + cookies + headers + parametric metadata
import { cookies, headers } from 'next/headers';

async function fetchNote(id) {
  const notes = {
    "a1": { id: "a1", title: "First Note", body: "Hello from a1" },
    "b2": { id: "b2", title: "Second Note", body: "Hello from b2" },
  };
  return Promise.resolve(notes[id] || null);
}

export async function generateMetadata({ params }) {
  const p = params || {};
  const note = await fetchNote(p.id);
  return {
    title: note ? note.title : "Not Found",
    description: note ? note.body : "Missing note",
  };
}

export default async function NotePage({ params }) {
  const p = params || {};
  const note = await fetchNote(p.id);
  const c = cookies();
  const h = headers();
  if (!note) {
    return <div><h1>Not Found</h1></div>;
  }
  return (
    <article>
      <h1>{note.title}</h1>
      <p>{note.body}</p>
      <footer>Note id: {note.id}, host: {h.get("Host") || "?"}</footer>
    </article>
  );
}
