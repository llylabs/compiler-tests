// Stress test — rapid fire requests to test stability under load
// 20 probe rounds with 500ms intervals = 10+ seconds sustained load
// @port: 8095
// @probe: GET /ping
// @expect-status: 200
// @expect-body-contains: pong
// @probe: POST /echo
// @post-body: {"message":"stress-test","round":1}
// @expect-status: 200
// @expect-body-contains: stress-test
// @probe: GET /stats
// @expect-status: 200
// @expect-body-contains: "total"
// @probe-count: 20
// @probe-interval: 500
// @timeout: 120000

var http = require("http");

var stats = {
  total: 0,
  gets: 0,
  posts: 0,
  errors: 0,
  startTime: Date.now(),
};

var server = http.createServer(function (req, res) {
  stats.total++;

  if (req.method === "GET" && req.url === "/ping") {
    stats.gets++;
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("pong");
    return;
  }

  if (req.method === "POST" && req.url === "/echo") {
    stats.posts++;
    var body = "";
    req.on("data", function (chunk) { body += chunk.toString(); });
    req.on("end", function () {
      try {
        var parsed = JSON.parse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          echo: parsed,
          server_request_num: stats.total,
          timestamp: Date.now(),
        }));
      } catch (e) {
        stats.errors++;
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid json" }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/stats") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      total: stats.total,
      gets: stats.gets,
      posts: stats.posts,
      errors: stats.errors,
      uptime_ms: Date.now() - stats.startTime,
    }));
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(8095, function () {
  console.log("Stress test server on port 8095");
});
