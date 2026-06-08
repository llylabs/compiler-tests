// Test: string.h — strstr, strchr, strrchr, memchr
// @expect-exit: 0
// @expect-contains: strstr found: world
// @expect-contains: strstr null: (null)
// @expect-contains: strchr found: llo world
// @expect-contains: strrchr found: ld
// @expect-contains: memchr found at offset 6
#include <stdio.h>
#include <string.h>

int main() {
    const char *s = "hello world";

    char *p = strstr(s, "world");
    printf("strstr found: %s\n", p);

    p = strstr(s, "xyz");
    printf("strstr null: %s\n", p ? p : "(null)");

    p = strchr(s, 'l');
    printf("strchr found: %s\n", p);

    p = strrchr(s, 'l');
    printf("strrchr found: %s\n", p);

    p = memchr(s, 'w', strlen(s));
    printf("memchr found at offset %d\n", (int)(p - s));

    return 0;
}
