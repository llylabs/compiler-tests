// Used by the cap-js-http detached-flow case. Binds a different port
// from the synchronous /run cases so the two can coexist in the same
// agent without colliding.
const http = require("http");
const PORT = parseInt(process.env.PORT || "18221", 10);
http.createServer((req, res) => {
  res.end("detached-hello\n");
}).listen(PORT);
console.log("hello_detached listening", PORT);
