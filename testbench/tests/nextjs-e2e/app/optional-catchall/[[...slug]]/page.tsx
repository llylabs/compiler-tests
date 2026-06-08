export default function Page({ params }) {
  return (
    <div>
      <h1>optional-catchall</h1>
      <p>slug={JSON.stringify(params.slug || [])}</p>
    </div>
  )
}
