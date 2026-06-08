import React from 'react';
globalThis.__nex_request_headers = {"host":"127.0.0.1:35993","connection":"keep-alive","accept":"*/*","accept-language":"*","sec-fetch-mode":"cors","user-agent":"node","accept-encoding":"gzip, deflate","x-lly-nonce":"4GS96VxJqrriJZda5plh3Q"};
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
// Set in one module-level statement
globalThis.__lly_test_shared = { count: 0, marker: 'set-once' };

function reader() {
  return globalThis.__lly_test_shared;
}

function __Page__() {
  globalThis.__lly_test_shared.count = globalThis.__lly_test_shared.count + 1;
  const s = reader();
  return (
    <div>
      <h1>Shared GlobalThis</h1>
      <p data-testid="marker">marker: {s.marker}</p>
      <p data-testid="count">count: {s.count}</p>
    </div>
  );
}
var __params = {};
if (typeof globalThis !== 'undefined') { globalThis.__lly_route_params = __params; }
var __searchParams = {};
// #100 Server Actions: tag in-scope exports.
try { if (typeof submitName === 'function') submitName.__lly_action_ref = 'DoDmEOXGOKPc8KQ0VVE4Ig'; } catch (__e) {}
try { if (typeof createPost === 'function') createPost.__lly_action_ref = 'VSa_zSsPBav8WU_D5Xzi3A'; } catch (__e) {}
try { if (typeof deletePost === 'function') deletePost.__lly_action_ref = '8JEs6DvrTB7W8URbtzd27w'; } catch (__e) {}
try { if (typeof inlineSubmit === 'function') inlineSubmit.__lly_action_ref = 'jWvWNCWLaMLDyApGUkWPGw'; } catch (__e) {}
try { if (typeof addItem === 'function') addItem.__lly_action_ref = 'ogjgaoTe-EDD94UdPah1Zg'; } catch (__e) {}
try { if (typeof noop === 'function') noop.__lly_action_ref = 'lINSiPTWuv5XD7b8PkogVA'; } catch (__e) {}
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
