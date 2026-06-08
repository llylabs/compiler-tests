// @probe: GET /ok
// @expect-status: 200
//
// @probe: GET /created
// @expect-status: 201
//
// @probe: GET /bad
// @expect-status: 400
//
// @probe: GET /error
// @expect-status: 500
#include "nex_http.h"

int main() {
    int port = nex_get_port(8080);
    long long server = nex_server_create(port);

    for (int i = 0; i < 4; i++) {
        long long req = nex_server_accept(server);
        if (NEX_GET_TAG(req) == NEX_TAG_UNDEF) continue;

        long long req_id = nex_req_get(req, "id");
        long long url_tagged = nex_req_get(req, "url");

        char url[256];
        nex_read_string(url_tagged, url, sizeof(url));

        int status = 200;
        if (strcmp(url, "/created") == 0) status = 201;
        else if (strcmp(url, "/bad") == 0) status = 400;
        else if (strcmp(url, "/error") == 0) status = 500;

        nex_server_respond(req_id, status, "done", "text/plain");
    }

    nex_server_close(server);
    return 0;
}
