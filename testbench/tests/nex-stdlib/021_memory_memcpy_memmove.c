// Test: string.h — memcpy, memmove (overlap), memset, memcmp
// @expect-exit: 0
// @expect-contains: memcpy: hello
// @expect-contains: memmove overlap: abcbcde
// @expect-contains: memset: AAAAA
// @expect-contains: memcmp equal: 0
// @expect-contains: memcmp less: -1
// @expect-contains: memcmp greater: 1
#include <stdio.h>
#include <string.h>

int main() {
    char src[] = "hello";
    char dst[16];
    memcpy(dst, src, 6);
    printf("memcpy: %s\n", dst);

    // memmove with overlapping regions
    char buf[] = "abcdefg";
    memmove(buf + 3, buf + 1, 4);  // "abc" + "bcde" overlap
    buf[7] = '\0';
    printf("memmove overlap: %s\n", buf);

    // memset
    char fill[6];
    memset(fill, 'A', 5);
    fill[5] = '\0';
    printf("memset: %s\n", fill);

    // memcmp
    printf("memcmp equal: %d\n", memcmp("abc", "abc", 3));
    printf("memcmp less: %d\n", memcmp("abc", "abd", 3) < 0 ? -1 : 1);
    printf("memcmp greater: %d\n", memcmp("abd", "abc", 3) > 0 ? 1 : -1);

    return 0;
}
