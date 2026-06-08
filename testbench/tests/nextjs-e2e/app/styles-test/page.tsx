// Inline styles work; CSS Modules would need separate file
export default function StylesPage() {
  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
      <div className="card" style={{padding: '16px', background: '#eee'}}>Card A</div>
      <div className="card" style={{padding: '16px', background: '#ddd'}}>Card B</div>
    </div>
  );
}
