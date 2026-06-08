// Echoes the request method + URL path in the body.
const http = require("http");
const PORT = parseInt(process.env.PORT || "18212", 10);
http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.end(req.method + " " + req.url + "\n");
}).listen(PORT);
console.log("echo_method listening", PORT);
