import React from 'react';
globalThis.__nex_request_headers = {"host":"127.0.0.1:44249","connection":"keep-alive","accept":"*/*","accept-language":"*","sec-fetch-mode":"cors","user-agent":"node","accept-encoding":"gzip, deflate","x-lly-nonce":"U5x5wQvcrvApiC_84cTMPw"};
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

async function SlowChild() {
  // Will return a Promise object that's never awaited Ã¢ÂÂ Suspense should
  // detect the thenable in the children subtree and render the fallback.
  await new Promise((r) => setTimeout(r, 1000));
  return <div data-testid="slow">slow content</div>;
}

function Loading() {
  return <p data-testid="fallback">loading...</p>;
}

function __Page__() {
  return (
    <div>
      <h1>Suspense Test</h1>
      <Suspense fallback={<Loading/>}>
        <SlowChild/>
      </Suspense>
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

async function __lly_resolve_tree(root) {
    var worklist = [{ holder: { v: root }, key: 'v' }];
    var iters = 0;
    while (worklist.length > 0 && iters < 4096) {
        iters++;
        var task = worklist.pop();
        var node = task.holder[task.key];
        if (node === null || node === undefined) continue;
        if (typeof node !== 'object') continue;
        // Single-await: unwrap promise or pass through.
        var awaited;
        try { awaited = await node; } catch (_) { awaited = null; }
        if (awaited !== node) {
            task.holder[task.key] = awaited;
            worklist.push(task);
            continue;
        }
        if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                worklist.push({ holder: node, key: i });
            }
            continue;
        }
        if (node.__type === 'suspense') {
            worklist.push({ holder: node, key: 'children' });
            worklist.push({ holder: node, key: 'fallback' });
            continue;
        }
        if (node.__type === 'fragment') {
            worklist.push({ holder: node, key: 'children' });
            continue;
        }
        if (node.props !== undefined && node.props !== null) {
            if (node.props.children !== undefined) {
                worklist.push({ holder: node.props, key: 'children' });
            }
        }
    }
    return worklist.length === 0 ? root : root;
}
async function __render_main() {
    var __meta = {};
    if (typeof __layout_metadata_0 !== 'undefined' && __layout_metadata_0) Object.assign(__meta, __layout_metadata_0);
    if (typeof __page_metadata !== 'undefined' && __page_metadata) Object.assign(__meta, __page_metadata);
    var __viewport = {};
    if (Object.keys(__viewport).length > 0) { __meta._viewport = __viewport; }
    globalThis.__lly_meta = __meta;
    console.log('__NEX_META__:' + JSON.stringify(__meta));
    var __page_el = await __Page__({ params: __params, searchParams: __searchParams });
    try { __page_el = await __lly_resolve_tree(__page_el); } catch (__walk_err) { console.log('[D3-walk] page err:', __walk_err); }
    var __wrapped = React.createElement('div', { id: '__lly_hydrate_root' }, __page_el);
    try {
        __wrapped = await __Layout0__({ children: __wrapped });
    } catch (__layout_err) {
        console.log("[render] layout 0 threw: " + __layout_err);
    }
    try { __wrapped = await __lly_resolve_tree(__wrapped); } catch (__walk_err) { console.log('[D3-walk] final err:', __walk_err); }
    globalThis.__lly_status = 200;
    console.log('__NEX_STATUS__:200');
    console.log(renderToString(__wrapped));
}
__render_main();
