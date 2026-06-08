import { createPost, deletePost } from './actions';

export default function ServerFormPage() {
  return (
    <div>
      <h1>Server Form</h1>
      <form action={createPost} method="post">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" defaultValue="My post" />
        <label htmlFor="body">Body</label>
        <textarea id="body" name="body" defaultValue="Some body" />
        <button type="submit">Create</button>
      </form>
      <hr />
      <form action={deletePost} method="post">
        <input name="id" type="hidden" value="42" />
        <button type="submit">Delete</button>
      </form>
    </div>
  );
}
