export default function StyledPage() {
  return (
    <div style={{maxWidth: 800, margin: '0 auto', padding: 20}}>
      <h1 style={{color: '#333', fontSize: 32, borderBottom: '2px solid #eee'}}>Styled Page</h1>
      <div style={{display: 'flex', gap: 16}}>
        <div style={{flex: 1, backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8}}>
          <h3>Card One</h3>
          <p style={{color: '#666', lineHeight: 1.5}}>This card has inline styles</p>
        </div>
        <div style={{flex: 1, backgroundColor: '#e8f4fd', padding: 16, borderRadius: 8}}>
          <h3>Card Two</h3>
          <p style={{color: '#666', lineHeight: 1.5}}>Flex layout works</p>
        </div>
      </div>
    </div>
  );
}
