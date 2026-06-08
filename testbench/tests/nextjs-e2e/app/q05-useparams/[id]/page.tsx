import { useParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  return (
    <div>
      <h1>q05-useparams</h1>
      <p>params={JSON.stringify(params)}</p>
    </div>
  )
}
