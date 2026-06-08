class Counter {
  constructor(initial) {
    this.count = initial || 0;
  }
  inc() { this.count = this.count + 1; return this; }
  dec() { this.count = this.count - 1; return this; }
  get value() { return this.count; }
}

class Named extends Counter {
  constructor(name, initial) {
    super(initial);
    this.name = name;
  }
  describe() { return this.name + ": " + this.count; }
}

export default function ClassSyntaxPage() {
  const c = new Counter(10);
  c.inc().inc().dec();
  const n = new Named("Alice", 5);
  n.inc();
  return (
    <div>
      <h1>Class Syntax</h1>
      <p>Counter value: {c.value}</p>
      <p>Named: {n.describe()}</p>
    </div>
  );
}
