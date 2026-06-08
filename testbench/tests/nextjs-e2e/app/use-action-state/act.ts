'use server';

export async function submitName(prevState, formData) {
  var name = formData && formData.get ? formData.get('name') : '';
  if (!name || name.length === 0) {
    return { ok: false, error: 'empty', name: '' };
  }
  return { ok: true, error: null, name: String(name) };
}
