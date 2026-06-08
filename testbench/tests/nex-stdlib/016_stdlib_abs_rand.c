// Test: stdlib.h — abs, labs, rand, srand
// @expect-exit: 0
// @expect-contains: abs(-42)=42
// @expect-contains: abs(42)=42
// @expect-contains: labs(-100000)=100000
// @expect-contains: rand deterministic: ok
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("abs(-42)=%d\n", abs(-42));
    printf("abs(42)=%d\n", abs(42));
    printf("labs(-100000)=%ld\n", labs(-100000L));

    // srand/rand determinism: same seed → same sequence
    srand(12345);
    int a = rand();
    int b = rand();
    srand(12345);
    int c = rand();
    int d = rand();
    if (a == c && b == d)
        printf("rand deterministic: ok\n");
    else
        printf("rand deterministic: FAIL\n");

    return 0;
}
