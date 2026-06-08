// Test: assert.h — assert passes, NDEBUG disables
// @expect-exit: 0
// @expect-contains: assert passed
// @expect-contains: all ok
#include <stdio.h>
#include <assert.h>

int main() {
    assert(1 == 1);
    assert(42 > 0);
    assert("string literal");
    printf("assert passed\n");

    int x = 10;
    assert(x == 10);
    printf("all ok\n");
    return 0;
}
