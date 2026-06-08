// Test: stdlib.h — string-to-number conversion functions
// @expect-exit: 0
// @expect-contains: atoi(42)=42
// @expect-contains: atoi(-7)=-7
// @expect-contains: atol(123456)=123456
// @expect-contains: atof(3.14)=3.140
// @expect-contains: strtol(ff,16)=255
// @expect-contains: strtol(77,8)=63
// @expect-contains: strtoul(ffffffff,16)=4294967295
// @expect-contains: strtod(1.23e2)=123.000
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("atoi(42)=%d\n", atoi("42"));
    printf("atoi(-7)=%d\n", atoi("-7"));
    printf("atol(123456)=%ld\n", atol("123456"));
    printf("atof(3.14)=%.3f\n", atof("3.14"));

    char *end;
    printf("strtol(ff,16)=%ld\n", strtol("ff", &end, 16));
    printf("strtol(77,8)=%ld\n", strtol("77", &end, 8));
    printf("strtoul(ffffffff,16)=%lu\n", strtoul("ffffffff", &end, 16));
    printf("strtod(1.23e2)=%.3f\n", strtod("1.23e2", &end));
    return 0;
}
