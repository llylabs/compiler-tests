// Long-running stability test — probes over 60+ seconds
// Tests that the service doesn't degrade, leak memory, or crash
// @port: 8097
// @probe: GET /health
// @expect-status: 200
// @expect-body-contains: "alive":true
// @probe: GET /allocate?kb=512
// @expect-status: 200
// @expect-body-contains: "allocated"
// @probe: GET /metrics
// @expect-status: 200
// @expect-body-contains: "heap"
// @probe-count: 30
// @probe-interval: 2000
// @timeout: 120000

var http = require("http");

var startTime = Date.now();
var totalAllocated = 0;
var requestCount = 0;
var peakConcurrent = 0;
var currentConcurrent = 0;

// Keep some allocations around to simulate realistic memory usage
var allocations = [];
var MAX_ALLOCATIONS = 20;

function parseQuery(url) {
  var q = {};
  var idx = url.indexOf("?");
  if (idx === -1) return q;
  url.slice(idx + 1).split("&").forEach(function (p) {
    var kv = p.split("=");
    q[kv[0]] = kv[1] || "";
  });
  return q;
}

var server = http.createServer(function (req, res) {
  requestCount++;
  currentConcurrent++;
  if (currentConcurrent > peakConcurrent) peakConcurrent = currentConcurrent;

  var pathname = req.url.split("?")[0];
  var query = parseQuery(req.url);

  if (pathname === "/health") {
    var uptimeMs = Date.now() - startTime;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      alive: true,
      uptime_ms: uptimeMs,
      uptime_s: Math.floor(uptimeMs / 1000),
      requests: requestCount,
    }));
    currentConcurrent--;
    return;
  }

  if (pathname === "/allocate") {
    var kb = parseInt(query.kb) || 64;
    // Create array of specified size to exercise memory
    var arr = new Array(kb * 128);  // ~1KB per 128 elements
    for (var i = 0; i < arr.length; i++) {
      arr[i] = i * 1.5;
    }
    totalAllocated += kb;

    // Keep a rolling window of allocations
    allocations.push(arr);
    if (allocations.length > MAX_ALLOCATIONS) {
      allocations.shift();  // Let old allocations be GC'd
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      allocated: kb + "KB",
      total_allocated_kb: totalAllocated,
      active_allocations: allocations.length,
      sum_check: arr[0] + arr[arr.length - 1],  // Verify data integrity
    }));
    currentConcurrent--;
    return;
  }

  if (pathname === "/metrics") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      heap: {
        total_allocated_kb: totalAllocated,
        active_allocations: allocations.length,
      },
      requests: {
        total: requestCount,
        peak_concurrent: peakConcurrent,
      },
      uptime_ms: Date.now() - startTime,
    }));
    currentConcurrent--;
    return;
  }

  res.writeHead(404);
  res.end("not found");
  currentConcurrent--;
});

server.listen(8097, function () {
  console.log("Long-running stability server on port 8097");
});
