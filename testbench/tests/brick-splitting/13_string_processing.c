// Test: String processing across multiple functions — heap + stack memory
// @expect-exit: 0
// @expect-contains: HELLO
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
char to_upper(char c) { return (c >= 'a' && c <= 'z') ? c - 32 : c; }
void uppercase(char *dst, const char *src) {
    int i;
    for (i = 0; src[i]; i++) dst[i] = to_upper(src[i]);
    dst[i] = 0;
}
int main() {
    char *buf = malloc(64);
    uppercase(buf, "hello");
    printf("%s\n", buf);
    free(buf);
    return 0;
}
