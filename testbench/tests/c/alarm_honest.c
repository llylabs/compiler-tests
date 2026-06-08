/* M6 DoD: alarm() returnt 0 (kein vorheriger Timer), errno bleibt 0.
 * Wir setzen errno bewusst auf 999 vor dem Call und prüfen dass alarm()
 * es NICHT überschreibt. */
#include <stdio.h>
#include <unistd.h>
#include <errno.h>

int main(void) {
    errno = 999;
    unsigned int prev = alarm(5);
    int err_after = errno;
    printf("alarm(5)=%u errno_unchanged=%d\n", prev, err_after == 999);
    return 0;
}
