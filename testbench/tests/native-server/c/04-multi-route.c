// @probe: GET /
// @expect-status: 200
// @expect-body-contains: Welcome
//
// @probe: GET /health
// @expect-status: 200
// @expect-body-contains: ok
//
// @probe: GET /notfound
// @expect-status: 404
// @expect-body-contains: Not Found
#include "nex_http.h"

void handle_request(long long server) {
    long long req = nex_server_accept(server);
    if (NEX_GET_TAG(req) == NEX_TAG_UNDEF) return;

    long long req_id = nex_req_get(req, "id");
    long long url_tagged = nex_req_get(req, "url");

    char url[256];
    nex_read_string(url_tagged, url, sizeof(url));

    if (strcmp(url, "/") == 0) {
        nex_server_respond(req_id, 200, "Welcome", "text/plain");
    } else if (strcmp(url, "/health") == 0) {
        nex_server_respond(req_id, 200, "ok", "text/plain");
    } else {
        nex_server_respond(req_id, 404, "Not Found", "text/plain");
    }
}

int main() {
    int port = nex_get_port(8080);
    long long server = nex_server_create(port);

    // Handle 3 requests
    handle_request(server);
    handle_request(server);
    handle_request(server);

    nex_server_close(server);
    return 0;
}
