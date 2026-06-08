// Test: string.h — strdup, strnlen, strncpy, strncat
// @expect-exit: 0
// @expect-contains: strdup: hello
// @expect-contains: strnlen(hello,10)=5
// @expect-contains: strnlen(hello,3)=3
// @expect-contains: strncpy: hel
// @expect-contains: strncat: hel world
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int main() {
    // strdup
    char *dup = strdup("hello");
    printf("strdup: %s\n", dup);
    free(dup);

    // strnlen
    printf("strnlen(hello,10)=%d\n", (int)strnlen("hello", 10));
    printf("strnlen(hello,3)=%d\n", (int)strnlen("hello", 3));

    // strncpy
    char buf[32];
    memset(buf, 0, sizeof(buf));
    strncpy(buf, "hello", 3);
    printf("strncpy: %s\n", buf);

    // strncat
    strncat(buf, " world", 6);
    printf("strncat: %s\n", buf);

    return 0;
}
