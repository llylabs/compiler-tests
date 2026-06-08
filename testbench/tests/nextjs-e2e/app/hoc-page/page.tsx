// Higher-Order Component pattern
function withBorder(Comp) {
  return function Wrapped(props) {
    return (
      <div style={{border: '1px solid black', padding: '8px'}}>
        <Comp {...props} />
      </div>
    );
  };
}

function PlainCard(props) {
  return <h2>Card: {props.title}</h2>;
}

const BorderedCard = withBorder(PlainCard);

export default function HocPage() {
  return (
    <div>
      <h1>HOC Pattern</h1>
      <BorderedCard title="First" />
      <BorderedCard title="Second" />
    </div>
  );
}
