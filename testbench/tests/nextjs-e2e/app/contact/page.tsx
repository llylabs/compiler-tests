export default function Contact() {
  return (
    <div>
      <h1>Contact Us</h1>
      <form action="/api/contact" method="POST">
        <div>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" required placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="message">Message:</label>
          <textarea id="message" name="message" rows={5} placeholder="Your message"></textarea>
        </div>
        <button type="submit">Send Message</button>
      </form>
    </div>
  );
}
