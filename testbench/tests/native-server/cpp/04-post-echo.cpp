// @probe: POST /echo
// @post-body: cpp echo test
// @expect-status: 200
// @expect-body-contains: cpp echo test
#include "nex_http.h"

int main() {
    int port = nex_get_port(8080);
    long long server = nex_server_create(port);

    long long req = nex_server_accept(server);
    long long req_id = nex_req_get(req, "id");
    long long body_tagged = nex_req_get(req, "body");

    char body[4096];
    nex_read_string(body_tagged, body, sizeof(body));

    nex_server_respond(req_id, 200, body, "text/plain");
    nex_server_close(server);
    return 0;
}
