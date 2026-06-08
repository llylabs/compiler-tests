// Contact page — full form with all field types

export default function ContactPage() {
  return (
    <div style={{maxWidth: 640, margin: '0 auto'}}>
      <h1>Contact Us</h1>
      <p style={{color: '#666', marginBottom: 24}}>Have a question, feedback, or want to contribute? Drop us a message.</p>

      <form action="/api/contact" method="POST" style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        <div>
          <label htmlFor="name" style={{display: 'block', fontWeight: 600, marginBottom: 4}}>Full Name *</label>
          <input type="text" id="name" name="name" required placeholder="Your full name" style={{width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6}} />
        </div>

        <div>
          <label htmlFor="email" style={{display: 'block', fontWeight: 600, marginBottom: 4}}>Email Address *</label>
          <input type="email" id="email" name="email" required placeholder="you@example.com" style={{width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6}} />
        </div>

        <div>
          <label htmlFor="subject" style={{display: 'block', fontWeight: 600, marginBottom: 4}}>Subject</label>
          <select id="subject" name="subject" style={{width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6}}>
            <option value="general">General Inquiry</option>
            <option value="feedback">Feedback</option>
            <option value="contribute">Contribute</option>
            <option value="bug">Bug Report</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" style={{display: 'block', fontWeight: 600, marginBottom: 4}}>Message *</label>
          <textarea id="message" name="message" required rows={6} placeholder="Tell us what's on your mind..." style={{width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6}}></textarea>
        </div>

        <div style={{display: 'flex', gap: 12}}>
          <input type="checkbox" id="newsletter" name="newsletter" />
          <label htmlFor="newsletter" style={{color: '#666'}}>Subscribe to our newsletter</label>
        </div>

        <button type="submit" style={{backgroundColor: '#1a1a2e', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer'}}>
          Send Message
        </button>
      </form>
    </div>
  );
}
