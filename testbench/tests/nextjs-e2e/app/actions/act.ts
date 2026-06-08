'use server';

export async function addItem(formData) {
  var title = formData && formData.get ? formData.get('title') : 'untitled';
  return { ok: true, title };
}
