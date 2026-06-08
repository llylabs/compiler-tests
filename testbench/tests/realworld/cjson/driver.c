/* Driver for cJSON — parse + lookup + print round-trip.
   Note: avoids printf(%s) which would pull in fputs.o from wasi-sysroot
   and trigger a strlen import-module mismatch. We use putchar loops
   to emit string content. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* cJSON.h is included via cJSON.c in wrapper.c */

static void emit_str(const char *prefix, const char *s) {
    for (const char *p = prefix; *p; p++) putchar(*p);
    for (const char *p = s; *p; p++) putchar(*p);
    putchar('\n');
}

int main(void) {
    const char *json =
        "{\"name\":\"alpha\",\"value\":42,\"items\":[1,2,3],\"flag\":true}";

    cJSON *root = cJSON_Parse(json);
    if (!root) {
        emit_str("FAIL ", "parse");
        return 1;
    }
    emit_str("OK ", "parse");

    cJSON *name = cJSON_GetObjectItem(root, "name");
    if (!name || !cJSON_IsString(name)) {
        emit_str("FAIL ", "name");
        cJSON_Delete(root);
        return 1;
    }
    emit_str("name=", name->valuestring);

    cJSON *val = cJSON_GetObjectItem(root, "value");
    if (!val || !cJSON_IsNumber(val)) {
        emit_str("FAIL ", "value");
        cJSON_Delete(root);
        return 1;
    }
    printf("value=%d\n", val->valueint);

    char *out = cJSON_PrintUnformatted(root);
    if (!out) {
        emit_str("FAIL ", "print");
        cJSON_Delete(root);
        return 1;
    }
    cJSON *root2 = cJSON_Parse(out);
    if (!root2) {
        emit_str("FAIL re-parse: ", out);
        free(out);
        cJSON_Delete(root);
        return 1;
    }
    printf("OK print: %lu bytes\n", (unsigned long)strlen(out));

    cJSON_Delete(root2);
    free(out);
    cJSON_Delete(root);
    return 0;
}
