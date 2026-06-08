#ifndef NEX_HTTP_H
#define NEX_HTTP_H

// Tagged value helpers
#define NEX_TAG_INT   0x0LL
#define NEX_TAG_STR   0x3LL
#define NEX_TAG_OBJ   0x4LL
#define NEX_TAG_UNDEF 0x8LL
#define NEX_INT(x)    (((long long)(x) << 4) | NEX_TAG_INT)
#define NEX_GET_INT(x) ((int)((x) >> 4))
#define NEX_GET_TAG(x) ((x) & 0xFLL)

// Runtime imports
__attribute__((import_module("runtime"), import_name("http_server_create")))
long long __nex_http_server_create(long long port);

__attribute__((import_module("runtime"), import_name("http_server_accept")))
long long __nex_http_server_accept(long long server_id);

__attribute__((import_module("runtime"), import_name("http_server_respond")))
long long __nex_http_server_respond(long long req_id, long long status, long long body, long long content_type);

__attribute__((import_module("runtime"), import_name("http_server_close")))
long long __nex_http_server_close(long long server_id);

__attribute__((import_module("runtime"), import_name("object_get")))
long long __nex_object_get(long long obj, long long key);

__attribute__((import_module("runtime"), import_name("string_new")))
long long __nex_string_new(const char* ptr, long long len);

#include <string.h>
#include <stdlib.h>

// High-level C API

static inline long long nex_str(const char* s) {
    return __nex_string_new(s, NEX_INT(strlen(s)));
}

static inline long long nex_server_create(int port) {
    return __nex_http_server_create(NEX_INT(port));
}

static inline long long nex_server_accept(long long server) {
    return __nex_http_server_accept(server);
}

static inline int nex_server_respond(long long req_id, int status, const char* body, const char* content_type) {
    long long result = __nex_http_server_respond(
        req_id,
        NEX_INT(status),
        nex_str(body),
        nex_str(content_type)
    );
    return result != NEX_TAG_UNDEF;
}

static inline void nex_server_close(long long server) {
    __nex_http_server_close(server);
}

static inline long long nex_req_get(long long req, const char* key) {
    return __nex_object_get(req, nex_str(key));
}

// Read a tagged string back into a C buffer (limited, reads from WASM memory)
// Note: This reads the length-prefixed string format [u32 len][bytes]
static inline int nex_read_string(long long tagged, char* buf, int buf_size) {
    unsigned int offset = (unsigned int)(tagged >> 4);
    unsigned char* ptr = (unsigned char*)(long)offset;
    unsigned int len = *(unsigned int*)ptr;
    if ((int)len >= buf_size) len = buf_size - 1;
    memcpy(buf, ptr + 4, len);
    buf[len] = 0;
    return (int)len;
}

// Get port from PORT env var or use default
static inline int nex_get_port(int default_port) {
    const char* p = getenv("PORT");
    return p ? atoi(p) : default_port;
}

#endif
