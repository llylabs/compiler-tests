// Server action file: 'use server' actions can be imported and invoked
import { addItem } from './act';

export default function ActionsPage() {
  return (
    <div>
      <h1>Actions</h1>
      <form action={addItem} method="post">
        <input name="title" type="text" defaultValue="hello" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
