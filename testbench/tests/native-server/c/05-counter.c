// @probe: GET /count
// @expect-status: 200
// @expect-body-contains: 1
//
// @probe: GET /count
// @expect-status: 200
// @expect-body-contains: 2
//
// @probe: GET /count
// @expect-status: 200
// @expect-body-contains: 3
#include "nex_http.h"
#include <stdio.h>

int main() {
    int port = nex_get_port(8080);
    long long server = nex_server_create(port);
    int counter = 0;

    for (int i = 0; i < 3; i++) {
        long long req = nex_server_accept(server);
        if (NEX_GET_TAG(req) == NEX_TAG_UNDEF) continue;

        long long req_id = nex_req_get(req, "id");
        counter++;

        char buf[32];
        sprintf(buf, "%d", counter);
        nex_server_respond(req_id, 200, buf, "text/plain");
    }

    nex_server_close(server);
    return 0;
}
