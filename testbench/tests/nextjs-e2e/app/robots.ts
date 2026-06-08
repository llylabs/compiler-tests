export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin/" }],
    sitemap: "https://example.com/sitemap.xml",
  };
}
