export default function PostPage({params}) {
  return (
    <div>
      <h1>Post Detail</h1>
      <p>Params received: {JSON.stringify(params)}</p>
    </div>
  );
}
