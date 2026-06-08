'use server';

export async function createPost(formData) {
  // FormData-shape (or fallback). Returns the result for the action endpoint.
  var title = (formData && formData.get) ? formData.get('title') : 'untitled';
  var body = (formData && formData.get) ? formData.get('body') : '';
  return { id: 42, title, body, created: true };
}

export async function deletePost(formData) {
  var id = (formData && formData.get) ? formData.get('id') : null;
  return { deleted: true, id };
}
