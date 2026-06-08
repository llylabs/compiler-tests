export async function inlineSubmit(formData) {
  ;
  var title = formData && formData.get ? formData.get('title') : '';
  return { ok: true, title: String(title) };
}
