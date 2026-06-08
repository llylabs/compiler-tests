// Test: time.h — mktime, gmtime, localtime, strftime
// @expect-exit: 0
// @expect-contains: year=2000
// @expect-contains: month=1
// @expect-contains: day=1
// @expect-contains: strftime: 2000
#include <stdio.h>
#include <time.h>

int main() {
    // Build a known date: 2000-01-01 00:00:00 UTC
    struct tm t;
    t.tm_year = 100;  // years since 1900
    t.tm_mon = 0;     // January
    t.tm_mday = 1;
    t.tm_hour = 0;
    t.tm_min = 0;
    t.tm_sec = 0;
    t.tm_isdst = 0;

    time_t epoch = mktime(&t);

    // Convert back
    struct tm *gm = gmtime(&epoch);
    printf("year=%d\n", gm->tm_year + 1900);
    printf("month=%d\n", gm->tm_mon + 1);
    printf("day=%d\n", gm->tm_mday);

    // strftime
    char buf[64];
    strftime(buf, sizeof(buf), "%Y", gm);
    printf("strftime: %s\n", buf);

    return 0;
}
