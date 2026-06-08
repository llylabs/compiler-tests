import React from 'react';
globalThis.__nex_request_headers = {"host":"127.0.0.1:42211","connection":"keep-alive","accept":"*/*","accept-language":"*","sec-fetch-mode":"cors","user-agent":"node","accept-encoding":"gzip, deflate","x-lly-nonce":"3qLjjk_xUrxtkIldi39V1A"};
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
import { headers } from 'next/headers';

function __Page__() {
  var h = headers();
  var host = h.get("Host") || "unknown";
  var ua = h.get("User-Agent") || "unknown";
  return (
    <div>
      <h1>Headers in Page</h1>
      <p>Host: {host}</p>
      <p>UA-len: {ua.length}</p>
    </div>
  );
}
var __params = {};
if (typeof globalThis !== 'undefined') { globalThis.__lly_route_params = __params; }
var __searchParams = {};
// #100 Server Actions: tag in-scope exports.
try { if (typeof inlineSubmit === 'function') inlineSubmit.__lly_action_ref = 'd05F-jAJqCwVDz_-2s3jSw'; } catch (__e) {}
try { if (typeof addItem === 'function') addItem.__lly_action_ref = 'tsWJVZsF-S3YzJihNzZbNQ'; } catch (__e) {}
try { if (typeof submitName === 'function') submitName.__lly_action_ref = 'U11vaN0SG209FDweRvX1gQ'; } catch (__e) {}
try { if (typeof createPost === 'function') createPost.__lly_action_ref = '6d-WUmD5h7RtCpMnAJnbzQ'; } catch (__e) {}
try { if (typeof deletePost === 'function') deletePost.__lly_action_ref = 'XbH7rKxTrYhMKjuATXS5pw'; } catch (__e) {}
try { if (typeof noop === 'function') noop.__lly_action_ref = 'Rmp6t18CytI0V_vMCbqdAw'; } catch (__e) {}
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
