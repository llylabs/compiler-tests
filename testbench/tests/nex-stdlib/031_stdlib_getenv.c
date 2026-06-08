// Test: stdlib.h — getenv (should return NULL for unknown vars)
// @expect-exit: 0
// @expect-contains: NONEXISTENT=(null)
#include <stdio.h>
#include <stdlib.h>

int main() {
    char *val = getenv("NONEXISTENT_NEX_VAR_12345");
    printf("NONEXISTENT=%s\n", val ? val : "(null)");
    return 0;
}
