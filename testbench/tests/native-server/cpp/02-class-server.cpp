// @probe: GET /
// @expect-status: 200
// @expect-body-contains: MyServer
//
// @probe: GET /health
// @expect-status: 200
// @expect-body-contains: ok
#include "nex_http.h"

class Server {
    long long srv;
    const char* name;
public:
    Server(int port, const char* n) : name(n) {
        srv = nex_server_create(port);
    }

    void handle() {
        long long req = nex_server_accept(srv);
        if (NEX_GET_TAG(req) == NEX_TAG_UNDEF) return;

        long long req_id = nex_req_get(req, "id");
        long long url_tagged = nex_req_get(req, "url");

        char url[256];
        nex_read_string(url_tagged, url, sizeof(url));

        if (strcmp(url, "/health") == 0) {
            nex_server_respond(req_id, 200, "ok", "text/plain");
        } else {
            nex_server_respond(req_id, 200, name, "text/plain");
        }
    }

    void close() { nex_server_close(srv); }
};

int main() {
    int port = nex_get_port(8080);
    Server s(port, "MyServer");
    s.handle();
    s.handle();
    s.close();
    return 0;
}
