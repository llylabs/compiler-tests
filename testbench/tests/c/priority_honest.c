/* M6 DoD: getpriority/setpriority sind ENOSYS, NICHT silent-Stubs. */
#include <stdio.h>
#include <sys/resource.h>
#include <errno.h>

int main(void) {
    errno = 0;
    int g = getpriority(PRIO_PROCESS, 0);
    int eg = errno;
    errno = 0;
    int s = setpriority(PRIO_PROCESS, 0, 0);
    int es = errno;
    printf("getpriority=%d errno=%d\n", g, eg);
    printf("setpriority=%d errno=%d\n", s, es);
    return 0;
}
