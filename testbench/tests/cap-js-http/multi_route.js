// Different responses per route. Validates dispatch logic & non-200 paths.
const http = require("http");
const PORT = parseInt(process.env.PORT || "18213", 10);
http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index") {
    res.setHeader("Content-Type", "text/plain");
    res.end("root-ok\n");
  } else if (req.url === "/json") {
    res.setHeader("Content-Type", "application/json");
    res.end('{"ok":true,"count":42}');
  } else if (req.url === "/created") {
    res.writeHead(201, { "Content-Type": "text/plain" });
    res.end("created\n");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not-found\n");
  }
}).listen(PORT);
console.log("multi_route listening", PORT);
