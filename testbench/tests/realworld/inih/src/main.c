/* inih r58 — minimal INI parser in pure C.
 * Tests C compiler path (cpp-c interop independent), file-less parsing
 * via ini_parse_string. */
#include "ini.h"
#include <stdio.h>
#include <string.h>

typedef struct {
    char host[64];
    int  port;
    char user[64];
} config;

static int handler(void* user, const char* section, const char* name, const char* value) {
    config* c = (config*)user;
    if (strcmp(section, "server") == 0 && strcmp(name, "host") == 0)
        snprintf(c->host, sizeof(c->host), "%s", value);
    else if (strcmp(section, "server") == 0 && strcmp(name, "port") == 0)
        c->port = atoi(value);
    else if (strcmp(section, "user") == 0 && strcmp(name, "name") == 0)
        snprintf(c->user, sizeof(c->user), "%s", value);
    return 1;
}

int main(void) {
    static const char* doc =
        "[server]\n"
        "host = ini.local\n"
        "port = 9090\n"
        "[user]\n"
        "name = alice\n";

    config c = {0};
    int rc = ini_parse_string(doc, handler, &c);
    printf("rc=%d host=%s port=%d user=%s\n", rc, c.host, c.port, c.user);
    if (rc == 0 && strcmp(c.host, "ini.local") == 0 && c.port == 9090 && strcmp(c.user, "alice") == 0)
        printf("inih:OK\n");
    else
        printf("inih:FAIL\n");
    fflush(stdout);
    return 0;
}
