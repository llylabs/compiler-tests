// Authors page — team profiles

var authors = [
  {id: 1, name: "Alice Chen", role: "Admin", bio: "Full-stack developer and open source enthusiast. Loves Rust and WebAssembly.", postCount: 3, avatar: "/avatars/alice.jpg"},
  {id: 2, name: "Bob Martinez", role: "Editor", bio: "DevOps engineer focused on cloud-native infrastructure and CI/CD pipelines.", postCount: 2, avatar: "/avatars/bob.jpg"},
  {id: 3, name: "Carol Kim", role: "Author", bio: "Frontend architect specializing in React, Next.js and design systems.", postCount: 1, avatar: "/avatars/carol.jpg"},
];

function AuthorCard({author}) {
  var roleColor = "#28a745";
  if (author.role === "Admin") roleColor = "#dc3545";
  if (author.role === "Editor") roleColor = "#fd7e14";
  return (
    <div style={{border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 16}}>
      <div style={{display: 'flex', gap: 16}}>
        <div style={{width: 80, height: 80, borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex'}}></div>
        <div style={{flex: 1}}>
          <h2 style={{margin: '0 0 4px'}}>{author.name}</h2>
          <span style={{backgroundColor: roleColor, color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 12}}>{author.role}</span>
          <p style={{color: '#666', lineHeight: 1.5, marginTop: 8}}>{author.bio}</p>
          <p style={{color: '#888', fontSize: 14}}>{author.postCount} published articles</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthorsPage() {
  return (
    <div>
      <h1>Our Authors</h1>
      <p style={{color: '#666', marginBottom: 24}}>Meet the team behind NEX Blog.</p>
      {authors.map(function(author) {
        return <AuthorCard key={author.id} author={author} />;
      })}
      <div style={{backgroundColor: '#f8f9fa', padding: 24, borderRadius: 8, marginTop: 24, textAlign: 'center'}}>
        <h3>Want to contribute?</h3>
        <p style={{color: '#666'}}>We are always looking for guest authors. <a href="/contact">Get in touch</a>!</p>
      </div>
    </div>
  );
}
