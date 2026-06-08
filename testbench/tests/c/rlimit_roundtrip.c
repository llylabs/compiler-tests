/* M6 DoD-Phase-0: setrlimit speichert echt in state.rlimits,
 * getrlimit liest exakt zurück. */
#include <stdio.h>
#include <sys/resource.h>

int main(void) {
    struct rlimit set = { 1024, 4096 };
    int rc_set = setrlimit(RLIMIT_NOFILE, &set);

    struct rlimit got;
    int rc_get = getrlimit(RLIMIT_NOFILE, &got);

    printf("setrlimit=%d getrlimit=%d cur=%lu max=%lu\n",
           rc_set, rc_get,
           (unsigned long)got.rlim_cur, (unsigned long)got.rlim_max);
    return 0;
}
