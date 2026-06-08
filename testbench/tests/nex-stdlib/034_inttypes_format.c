// Test: inttypes.h — PRId32, PRIu64, PRIx32 format macros
// @expect-exit: 0
// @expect-contains: i32=-42
// @expect-contains: u32=42
// @expect-contains: x32=2a
#include <stdio.h>
#include <stdint.h>
#include <inttypes.h>

int main() {
    int32_t i = -42;
    uint32_t u = 42;

    printf("i32=%" PRId32 "\n", i);
    printf("u32=%" PRIu32 "\n", u);
    printf("x32=%" PRIx32 "\n", u);
    return 0;
}
