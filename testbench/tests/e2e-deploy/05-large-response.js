// Large response payloads — tests memory handling and streaming
// Generates 100KB+ JSON, large HTML pages, binary-like data
// @port: 8094
// @probe: GET /large/json?items=500
// @expect-status: 200
// @expect-body-contains: "total":500
// @probe: GET /large/html?rows=200
// @expect-status: 200
// @expect-body-contains: </table>
// @probe: GET /large/repeat?size=50000
// @expect-status: 200
// @expect-body-contains: BLOCK_END
// @probe-count: 5
// @probe-interval: 2000
// @timeout: 90000

var http = require("http");

function generateItems(count) {
  var items = [];
  for (var i = 0; i < count; i++) {
    items.push({
      id: i,
      name: "item_" + i,
      value: Math.floor(i * 3.14159),
      tags: ["tag_" + (i % 5), "group_" + (i % 10)],
      nested: {
        a: i * 2,
        b: "str_" + i,
        c: i % 2 === 0,
      },
    });
  }
  return items;
}

function generateTable(rows) {
  var html = "<html><body><h1>Large Table</h1><table><tr><th>ID</th><th>Name</th><th>Value</th><th>Status</th></tr>";
  for (var i = 0; i < rows; i++) {
    html += "<tr><td>" + i + "</td><td>Row " + i + "</td><td>" + (i * 7) + "</td><td>" + (i % 2 === 0 ? "active" : "inactive") + "</td></tr>";
  }
  html += "</table></body></html>";
  return html;
}

function generateRepeat(size) {
  var chunk = "ABCDEFGHIJ";
  var result = "";
  while (result.length < size) {
    result += chunk;
  }
  return result.slice(0, size) + "\nBLOCK_END";
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

var server = http.createServer(function (req, res) {
  var query = parseQuery(req.url);
  var pathname = req.url.split("?")[0];

  if (pathname === "/large/json") {
    var items = parseInt(query.items) || 500;
    var data = generateItems(items);
    var body = JSON.stringify({ total: items, items: data });
    res.writeHead(200, { "Content-Type": "application/json", "Content-Length": String(Buffer.byteLength(body)) });
    res.end(body);
    return;
  }

  if (pathname === "/large/html") {
    var rows = parseInt(query.rows) || 200;
    var html = generateTable(rows);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (pathname === "/large/repeat") {
    var size = parseInt(query.size) || 50000;
    var repeated = generateRepeat(size);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(repeated);
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(8094, function () {
  console.log("Large response server on port 8094");
});
