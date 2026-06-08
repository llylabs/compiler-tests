// Stateful service — counter that persists across requests
// Verifies that in-memory state survives between probe rounds
// @local-run
// @port: 8092
// @probe: POST /counter/increment
// @post-body: {}
// @expect-status: 200
// @expect-body-contains: "count"
// @probe: GET /counter
// @expect-status: 200
// @expect-body-contains: "count"
// @probe: GET /counter/history
// @expect-status: 200
// @expect-body-contains: "events"
// @probe-count: 10
// @probe-interval: 500

var http = require("http");

var counters = {};
var history = [];

function getCounter(name) {
  if (!counters[name]) counters[name] = 0;
  return counters[name];
}

var server = http.createServer(function (req, res) {
  var parts = req.url.split("/").filter(Boolean);
  // POST /counter/increment
  if (req.method === "POST" && parts[0] === "counter" && parts[1] === "increment") {
    var name = parts[2] || "default";
    counters[name] = getCounter(name) + 1;
    history.push({ action: "increment", name: name, count: counters[name], time: Date.now() });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count: counters[name], name: name }));
    return;
  }
  // GET /counter
  if (req.method === "GET" && parts[0] === "counter" && !parts[1]) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count: getCounter("default"), all: counters }));
    return;
  }
  // GET /counter/history
  if (req.method === "GET" && parts[0] === "counter" && parts[1] === "history") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ events: history, total: history.length }));
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.listen(8092, function () {
  console.log("Stateful counter on port 8092");
});
