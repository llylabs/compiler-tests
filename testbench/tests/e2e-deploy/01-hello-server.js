// Basic HTTP server — simplest possible deploy test
// @local-run
// @port: 8090
// @probe: GET /
// @expect-status: 200
// @expect-body-contains: hello from nex
// @probe-count: 3
// @probe-interval: 500

var http = require("http");

var server = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("hello from nex");
});

server.listen(8090, function () {
  console.log("Server running on port 8090");
});
