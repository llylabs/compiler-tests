async function inlineSubmit(formData) {
  'use server';
  var title = formData && formData.get ? formData.get('title') : '';
  return { ok: true, title: String(title) };
}

export default function InlineActionPage() {
  return (
    <div>
      <h1>Inline Use Server</h1>
      <form action={inlineSubmit} method="post">
        <input name="title" defaultValue="from-inline" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
