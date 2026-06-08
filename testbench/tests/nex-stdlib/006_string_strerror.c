// Test: string.h — strerror
// @expect-exit: 0
// @expect-contains: errno 0:
// @expect-contains: errno 2:
// @expect-contains: errno 13:
#include <stdio.h>
#include <string.h>
#include <errno.h>

int main() {
    printf("errno 0: %s\n", strerror(0));
    printf("errno 2: %s\n", strerror(ENOENT));
    printf("errno 13: %s\n", strerror(EACCES));
    return 0;
}
