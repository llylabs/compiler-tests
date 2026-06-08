// Minimal HTTP server: every request returns "hello\n" with 200.
const http = require("http");
const PORT = parseInt(process.env.PORT || "18211", 10);
http.createServer((req, res) => {
  res.end("hello\n");
}).listen(PORT);
console.log("hello_plain listening", PORT);
