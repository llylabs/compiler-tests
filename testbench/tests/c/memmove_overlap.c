#include <stdio.h>
#include <string.h>

int main() {
    // memmove with overlapping regions (forward)
    char buf1[] = "abcdefghij";
    memmove(buf1 + 2, buf1, 6);
    printf("forward: %s\n", buf1);

    // memmove with overlapping regions (backward)
    char buf2[] = "abcdefghij";
    memmove(buf2, buf2 + 3, 5);
    printf("backward: %s\n", buf2);

    // memset
    char buf3[11];
    memset(buf3, 'A', 10);
    buf3[10] = '\0';
    printf("memset: %s\n", buf3);

    // memcmp
    char a[] = "hello";
    char b[] = "hello";
    char c[] = "hellp";
    printf("cmp eq: %d\n", memcmp(a, b, 5) == 0 ? 1 : 0);
    printf("cmp lt: %d\n", memcmp(a, c, 5) < 0 ? 1 : 0);

    // memcpy (non-overlapping)
    int src[] = {10, 20, 30, 40};
    int dst[4];
    memcpy(dst, src, 4 * sizeof(int));
    printf("memcpy:");
    for (int i = 0; i < 4; i++) printf(" %d", dst[i]);
    printf("\n");

    return 0;
}
