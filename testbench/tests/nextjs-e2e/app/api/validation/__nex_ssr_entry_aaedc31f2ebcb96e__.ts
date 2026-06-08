function __next_json(data, init) {
  var body = JSON.stringify(data);
  var status = 200;
  var hdrs = {};
  if (init && init.status) { status = init.status; }
  if (init && init.headers) { hdrs = init.headers; }
  hdrs['content-type'] = 'application/json';
  return { body: body, status: status, headers: hdrs };
}
function __next_redirect(url, status) {
  var hdrs = {};
  hdrs.location = url;
  return { body: null, status: status || 307, headers: hdrs };
}
var NextResponse = { json: __next_json, redirect: __next_redirect };
class Response {
  constructor(__b, __init) {
    __init = __init || {};
    if (__b == null) { this.body = ''; }
    else if (typeof __b === 'string') { this.body = __b; }
    else { this.body = JSON.stringify(__b); }
    this.status = __init.status || 200;
    this.headers = __init.headers || {};
  }
}

function validate(body) {
  const errors = {};
  if (!body || typeof body !== 'object') {
    errors["_root"] = "body must be an object";
    return errors;
  }
  if (!body.email || typeof body.email !== 'string' || body.email.indexOf("@") < 0) {
    errors["email"] = "invalid email";
  }
  if (!body.age || typeof body.age !== 'number' || body.age < 13) {
    errors["age"] = "age must be 13+";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

async function POST(request) {
  const body = request.json();
  const errors = validate(body);
  if (errors) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }
  return NextResponse.json({ ok: true, received: body });
}
var __method = "POST";
var __body = "";
var __url_full = "http://localhost/api/validation";
var __pathname = "/api/validation";
var __search_raw = "";
var __sp_entries = [];
var __req_headers = [];
__req_headers.push(["host", "127.0.0.1:37973"]);
__req_headers.push(["connection", "keep-alive"]);
__req_headers.push(["accept", "*/*"]);
__req_headers.push(["accept-language", "*"]);
__req_headers.push(["sec-fetch-mode", "cors"]);
__req_headers.push(["user-agent", "node"]);
__req_headers.push(["accept-encoding", "gzip, deflate"]);
__req_headers.push(["content-length", "0"]);
__req_headers.push(["x-lly-nonce", "izOW0RH2P30OlmwPVyuLKQ"]);
var __req_cookies = [];
function __mk_headers(arr) {
  return {
    get: function(k) {
      var lk = String(k).toLowerCase();
      for (var i = 0; i < arr.length; i++) {
        if (String(arr[i][0]).toLowerCase() === lk) return arr[i][1];
      }
      return null;
    },
    has: function(k) {
      var lk = String(k).toLowerCase();
      for (var i = 0; i < arr.length; i++) {
        if (String(arr[i][0]).toLowerCase() === lk) return true;
      }
      return false;
    },
    entries: function() { return arr.slice(); },
    keys: function() { var out=[]; for (var i=0;i<arr.length;i++) out.push(arr[i][0]); return out; },
    values: function() { var out=[]; for (var i=0;i<arr.length;i++) out.push(arr[i][1]); return out; },
    forEach: function(fn) { for (var i=0;i<arr.length;i++) fn(arr[i][1], arr[i][0]); }
  };
}
function __mk_search(arr) {
  return {
    get: function(k) {
      for (var i = 0; i < arr.length; i++) if (arr[i][0] === k) return arr[i][1];
      return null;
    },
    getAll: function(k) {
      var out=[]; for (var i=0;i<arr.length;i++) if (arr[i][0] === k) out.push(arr[i][1]);
      return out;
    },
    has: function(k) {
      for (var i = 0; i < arr.length; i++) if (arr[i][0] === k) return true;
      return false;
    },
    entries: function() { return arr.slice(); },
    toString: function() {
      var p=[]; for (var i=0;i<arr.length;i++) p.push(arr[i][0]+'='+arr[i][1]);
      return p.join('&');
    }
  };
}
function __mk_cookies(arr) {
  return {
    get: function(k) {
      for (var i = 0; i < arr.length; i++) if (arr[i][0] === k) return { name: k, value: arr[i][1] };
      return undefined;
    },
    getAll: function() {
      var out=[]; for (var i=0;i<arr.length;i++) out.push({name: arr[i][0], value: arr[i][1]});
      return out;
    },
    has: function(k) {
      for (var i = 0; i < arr.length; i++) if (arr[i][0] === k) return true;
      return false;
    }
  };
}
var __request = {};
__request.method = __method;
__request.body = __body;
__request.url = __url_full;
__request.json = function() { return JSON.parse(__body); };
__request.text = function() { return __body; };
__request.headers = __mk_headers(__req_headers);
__request.cookies = __mk_cookies(__req_cookies);
__request.nextUrl = {
  pathname: __pathname,
  search: __search_raw ? ('?' + __search_raw) : '',
  href: __url_full,
  searchParams: __mk_search(__sp_entries)
};
__request.params = {};
(async function () {
  var __response;
  function __allow_methods() {
    var ms = [];
    if (typeof GET === 'function') ms.push('GET');
    if (typeof POST === 'function') ms.push('POST');
    if (typeof PUT === 'function') ms.push('PUT');
    if (typeof DELETE === 'function') ms.push('DELETE');
    if (typeof PATCH === 'function') ms.push('PATCH');
    if (typeof HEAD === 'function' || typeof GET === 'function') ms.push('HEAD');
    ms.push('OPTIONS');
    return ms.join(', ');
  }
  try {
    if (__method === 'GET' && typeof GET === 'function') __response = await GET(__request);
    else if (__method === 'POST' && typeof POST === 'function') __response = await POST(__request);
    else if (__method === 'PUT' && typeof PUT === 'function') __response = await PUT(__request);
    else if (__method === 'DELETE' && typeof DELETE === 'function') __response = await DELETE(__request);
    else if (__method === 'PATCH' && typeof PATCH === 'function') __response = await PATCH(__request);
    else if (__method === 'HEAD') {
      if (typeof HEAD === 'function') __response = await HEAD(__request);
      else if (typeof GET === 'function') { __response = await GET(__request); if (__response) __response.body = ''; }
      else __response = {status: 405, headers: {'allow': __allow_methods()}, body: ''};
    }
    else if (__method === 'OPTIONS') {
      if (typeof OPTIONS === 'function') __response = await OPTIONS(__request);
      else __response = {status: 204, headers: {'allow': __allow_methods()}, body: ''};
    }
    else __response = {status: 405, body: '{"error":"Method not allowed"}', headers: {'allow': __allow_methods(), 'content-type': 'application/json'}};
  } catch (__err) {
    __response = {status: 500, body: JSON.stringify({error: String(__err)}), headers: {'content-type':'application/json'}};
  }
  var __status = (__response && __response.status) || 200;
  var __out_body;
  if (__response == null) { __out_body = '{}'; }
  else if (typeof __response.body === 'string') { __out_body = __response.body; }
  else if (__response.body != null) { __out_body = JSON.stringify(__response.body); }
  else { __out_body = '{}'; }
  var __out_headers = (__response && __response.headers) || {};
  // Normalize headers: object → array of [k,v]; Set-Cookie array → multiple entries.
  var __hdr_arr = [];
  if (Array.isArray(__out_headers)) {
    for (var i = 0; i < __out_headers.length; i++) __hdr_arr.push([__out_headers[i][0], __out_headers[i][1]]);
  } else if (__out_headers && typeof __out_headers === 'object') {
    for (var k in __out_headers) {
      if (!Object.prototype.hasOwnProperty.call(__out_headers, k)) continue;
      var v = __out_headers[k];
      if (Array.isArray(v)) { for (var j = 0; j < v.length; j++) __hdr_arr.push([k, String(v[j])]); }
      else { __hdr_arr.push([k, String(v)]); }
    }
  }
  console.log(JSON.stringify({s: __status, b: __out_body, h: __hdr_arr}));
})();
