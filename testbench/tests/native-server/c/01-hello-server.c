// @probe: GET /
// @expect-status: 200
// @expect-body-contains: Hello from C
#include "nex_http.h"

int main() {
    int port = nex_get_port(8080);
    long long server = nex_server_create(port);

    long long req = nex_server_accept(server);
    long long req_id = nex_req_get(req, "id");

    nex_server_respond(req_id, 200, "Hello from C", "text/plain");
    nex_server_close(server);
    return 0;
}
