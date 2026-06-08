// Test: time.h — time(), clock(), difftime()
// @expect-exit: 0
// @expect-contains: time > 0: ok
// @expect-contains: clock >= 0: ok
// @expect-contains: difftime: ok
#include <stdio.h>
#include <time.h>

int main() {
    time_t t = time(NULL);
    printf("time > 0: %s\n", t > 0 ? "ok" : "FAIL");

    clock_t c = clock();
    printf("clock >= 0: %s\n", c >= 0 ? "ok" : "FAIL");

    time_t t1 = 1000;
    time_t t2 = 2000;
    double diff = difftime(t2, t1);
    printf("difftime: %s\n", (diff > 999.0 && diff < 1001.0) ? "ok" : "FAIL");

    return 0;
}
