// JSON API with multiple endpoints and routing
// @local-run
// @port: 8091
// @probe: GET /api/status
// @expect-status: 200
// @expect-body-contains: "status":"ok"
// @probe: GET /api/info
// @expect-status: 200
// @expect-body-contains: "runtime":"nex"
// @expect-body-contains: "version"
// @probe: GET /api/not-found
// @expect-status: 404
// @expect-body-contains: "error"
// @probe-count: 5
// @probe-interval: 1000

var http = require("http");

var startTime = Date.now();
var requestCount = 0;

var routes = {
  "GET /api/status": function (req, res) {
    requestCount++;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      uptime_ms: Date.now() - startTime,
      requests_served: requestCount,
    }));
  },
  "GET /api/info": function (req, res) {
    requestCount++;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      runtime: "nex",
      version: "1.0.0",
      language: "javascript",
      features: ["http", "json", "routing"],
    }));
  },
};

var server = http.createServer(function (req, res) {
  var key = req.method + " " + req.url;
  var handler = routes[key];
  if (handler) {
    handler(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found", path: req.url }));
  }
});

server.listen(8091, function () {
  console.log("JSON API running on port 8091");
});
