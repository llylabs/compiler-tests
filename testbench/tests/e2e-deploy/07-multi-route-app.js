// Full web application simulation — HTML pages + API + static-like content
// Simulates a real-world app with multiple content types and routing
// @local-run
// @port: 8096
// @probe: GET /
// @expect-status: 200
// @expect-body-contains: <!DOCTYPE html>
// @expect-body-contains: NEX Dashboard
// @probe: GET /api/users
// @expect-status: 200
// @expect-body-contains: "users"
// @probe: POST /api/users
// @post-body: {"name":"Alice","email":"alice@example.com"}
// @expect-status: 201
// @expect-body-contains: "id"
// @expect-body-contains: Alice
// @probe: GET /api/users
// @expect-status: 200
// @expect-body-contains: Alice
// @probe: GET /about
// @expect-status: 200
// @expect-body-contains: About
// @probe: GET /health
// @expect-status: 200
// @expect-body-contains: "healthy":true
// @probe-count: 8
// @probe-interval: 1500

var http = require("http");

// In-memory data store
var users = [
  { id: 1, name: "System", email: "system@nex.dev", created: Date.now() },
];
var nextId = 2;

// HTML templates
function renderPage(title, body) {
  return '<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>' + title + '</title></head>\n<body>\n<nav><a href="/">Home</a> | <a href="/about">About</a></nav>\n<h1>' + title + '</h1>\n' + body + '\n</body>\n</html>';
}

function homePage() {
  var userList = users.map(function (u) {
    return "<li>" + u.name + " (" + u.email + ")</li>";
  }).join("\n");
  return renderPage("NEX Dashboard", "<h2>Users (" + users.length + ")</h2>\n<ul>" + userList + "</ul>");
}

function aboutPage() {
  return renderPage("About", "<p>NEX E2E Deploy Test Application</p><p>This is a full web app running on Cap OS.</p>");
}

// Request body parser
function readBody(req) {
  return new Promise(function (resolve) {
    var body = "";
    req.on("data", function (chunk) { body += chunk.toString(); });
    req.on("end", function () { resolve(body); });
  });
}

var requestLog = [];

var server = http.createServer(function (req, res) {
  requestLog.push({ method: req.method, url: req.url, time: Date.now() });

  // HTML routes
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(homePage());
    return;
  }

  if (req.method === "GET" && req.url === "/about") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(aboutPage());
    return;
  }

  // API routes
  if (req.method === "GET" && req.url === "/api/users") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ users: users, count: users.length }));
    return;
  }

  if (req.method === "POST" && req.url === "/api/users") {
    readBody(req).then(function (body) {
      try {
        var data = JSON.parse(body);
        var user = {
          id: nextId++,
          name: data.name || "Unknown",
          email: data.email || "unknown@example.com",
          created: Date.now(),
        };
        users.push(user);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(user));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid json" }));
      }
    });
    return;
  }

  // Health endpoint
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      healthy: true,
      users_count: users.length,
      requests_served: requestLog.length,
      uptime_ms: Date.now() - requestLog[0].time,
    }));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/html" });
  res.end(renderPage("404", "<p>Page not found: " + req.url + "</p>"));
});

server.listen(8096, function () {
  console.log("Multi-route app on port 8096");
});
