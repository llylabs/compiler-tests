// CPU-intensive service — computes primes, fibonacci, sorting
// Tests that heavy computation doesn't crash the runtime over time
// @port: 8093
// @probe: GET /compute/primes?n=1000
// @expect-status: 200
// @expect-body-contains: "count"
// @expect-body-contains: "primes"
// @probe: GET /compute/fibonacci?n=30
// @expect-status: 200
// @expect-body-contains: "result"
// @probe: GET /compute/sort?size=5000
// @expect-status: 200
// @expect-body-contains: "sorted":true
// @probe: GET /health
// @expect-status: 200
// @expect-body-contains: "ok"
// @probe-count: 8
// @probe-interval: 2000
// @timeout: 90000

var http = require("http");

function sieveOfEratosthenes(n) {
  var sieve = new Array(n + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (var i = 2; i * i <= n; i++) {
    if (sieve[i]) {
      for (var j = i * i; j <= n; j += i) {
        sieve[j] = false;
      }
    }
  }
  var primes = [];
  for (var k = 0; k <= n; k++) {
    if (sieve[k]) primes.push(k);
  }
  return primes;
}

function fibonacci(n) {
  if (n <= 1) return n;
  var a = 0, b = 1;
  for (var i = 2; i <= n; i++) {
    var tmp = a + b;
    a = b;
    b = tmp;
  }
  return b;
}

function generateAndSort(size) {
  var arr = [];
  // Simple LCG pseudo-random
  var seed = 12345;
  for (var i = 0; i < size; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    arr.push(seed);
  }
  arr.sort(function (a, b) { return a - b; });
  // Verify sorted
  for (var j = 1; j < arr.length; j++) {
    if (arr[j] < arr[j - 1]) return { sorted: false, size: size };
  }
  return { sorted: true, size: size };
}

function parseQuery(url) {
  var q = {};
  var idx = url.indexOf("?");
  if (idx === -1) return q;
  var pairs = url.slice(idx + 1).split("&");
  for (var i = 0; i < pairs.length; i++) {
    var kv = pairs[i].split("=");
    q[kv[0]] = kv[1] || "";
  }
  return q;
}

var requestCount = 0;
var startTime = Date.now();

var server = http.createServer(function (req, res) {
  requestCount++;
  var query = parseQuery(req.url);
  var pathname = req.url.split("?")[0];

  if (pathname === "/compute/primes") {
    var n = parseInt(query.n) || 1000;
    var start = Date.now();
    var primes = sieveOfEratosthenes(n);
    var elapsed = Date.now() - start;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count: primes.length, primes: primes.slice(0, 20), compute_ms: elapsed }));
    return;
  }

  if (pathname === "/compute/fibonacci") {
    var fn = parseInt(query.n) || 30;
    var start2 = Date.now();
    var result = fibonacci(fn);
    var elapsed2 = Date.now() - start2;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ n: fn, result: result, compute_ms: elapsed2 }));
    return;
  }

  if (pathname === "/compute/sort") {
    var sz = parseInt(query.size) || 5000;
    var start3 = Date.now();
    var sortResult = generateAndSort(sz);
    var elapsed3 = Date.now() - start3;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ sorted: sortResult.sorted, size: sortResult.size, compute_ms: elapsed3 }));
    return;
  }

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      uptime_ms: Date.now() - startTime,
      requests: requestCount,
    }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(8093, function () {
  console.log("Heavy compute server on port 8093");
});
