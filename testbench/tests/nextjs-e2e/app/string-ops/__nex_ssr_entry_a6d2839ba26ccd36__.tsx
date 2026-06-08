import React from 'react';
globalThis.__nex_request_headers = {"host":"127.0.0.1:44249","connection":"keep-alive","accept":"*/*","accept-language":"*","sec-fetch-mode":"cors","user-agent":"node","accept-encoding":"gzip, deflate","x-lly-nonce":"Av2OLU9FgvXTdqYZixzsww"};
globalThis.__nex_request_cookies = {};
var useState = React.useState;
var useEffect = React.useEffect;
var useLayoutEffect = React.useLayoutEffect;
var useMemo = React.useMemo;
var useCallback = React.useCallback;
var useRef = React.useRef;
var useReducer = React.useReducer;
var useId = React.useId;
var useContext = React.useContext;
var Suspense = React.Suspense;
var Fragment = React.Fragment;
var useActionState = React.useActionState;
var useFormState = React.useFormState;
var useTransition = React.useTransition;
var useDeferredValue = React.useDeferredValue;
var useOptimistic = React.useOptimistic;
var useSyncExternalStore = React.useSyncExternalStore;
var useInsertionEffect = React.useInsertionEffect;
var startTransition = React.startTransition;
var cache = React.cache;
var createContext = React.createContext;
function __Layout0__({children}) {
  return (
    <html lang="en">
      <head><title>NEX E2E Test</title><meta charSet="utf-8" /></head>
      <body>{children}</body>
    </html>
  );
}
function __Page__() {
  const s = "Hello World";
  const upper = s.toUpperCase();
  const lower = s.toLowerCase();
  const sliced = s.slice(0, 5);
  const replaced = s.replace("World", "Universe");
  const parts = s.split(" ");
  return (
    <div>
      <h1>String Ops</h1>
      <p>Upper: {upper}</p>
      <p>Lower: {lower}</p>
      <p>Sliced: {sliced}</p>
      <p>Replaced: {replaced}</p>
      <p>Parts: {parts.length}</p>
      <p>Concat: {s + "!"}</p>
      <p>Length: {s.length}</p>
    </div>
  );
}
var __params = {};
var __searchParams = {};
// #100 Server Actions: tag in-scope exports.
try { if (typeof createPost === 'function') createPost.__lly_action_ref = '7fdgMI9euME-4Bro9oUAHA'; } catch (__e) {}
try { if (typeof deletePost === 'function') deletePost.__lly_action_ref = '_WXPIpu2btZXIpr3_eDJNg'; } catch (__e) {}
try { if (typeof inlineSubmit === 'function') inlineSubmit.__lly_action_ref = 'WP69o3ciu-M-eko2A-XM4w'; } catch (__e) {}
try { if (typeof submitName === 'function') submitName.__lly_action_ref = 'gXZbvDv8RVQQFZ0q3oW30w'; } catch (__e) {}
try { if (typeof addItem === 'function') addItem.__lly_action_ref = 'MFhcFYGNVXrCHfiMm6vj0A'; } catch (__e) {}
function __render_main() {
    var __meta = {};
    if (typeof __layout_metadata_0 !== 'undefined' && __layout_metadata_0) Object.assign(__meta, __layout_metadata_0);
    if (typeof __page_metadata !== 'undefined' && __page_metadata) Object.assign(__meta, __page_metadata);
    var __viewport = {};
    if (Object.keys(__viewport).length > 0) { __meta._viewport = __viewport; }
    globalThis.__lly_meta = __meta;
    console.log('__NEX_META__:' + JSON.stringify(__meta));
    var __page_el = __Page__({ params: __params, searchParams: __searchParams });
    var __wrapped = React.createElement('div', { id: '__lly_hydrate_root', 'data-lly-hydrate-boundary': 'B:page-root' }, __page_el);
    try {
        __wrapped = __Layout0__({ children: __wrapped });
    } catch (__layout_err) {
        console.log("[render] layout 0 threw: " + __layout_err);
    }
    globalThis.__lly_status = 200;
    console.log('__NEX_STATUS__:200');
    console.log(renderToString(__wrapped));
}
__render_main();
