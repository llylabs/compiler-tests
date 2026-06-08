// Test: errno.h — errno setting and reading
// @expect-exit: 0
// @expect-contains: initial errno=0
// @expect-contains: ENOENT=2
// @expect-contains: EACCES=13
// @expect-contains: EINVAL=22
// @expect-contains: ENOMEM=12
#include <stdio.h>
#include <errno.h>

int main() {
    errno = 0;
    printf("initial errno=%d\n", errno);
    printf("ENOENT=%d\n", ENOENT);
    printf("EACCES=%d\n", EACCES);
    printf("EINVAL=%d\n", EINVAL);
    printf("ENOMEM=%d\n", ENOMEM);
    return 0;
}
