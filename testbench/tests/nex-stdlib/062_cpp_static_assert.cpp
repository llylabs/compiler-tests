// Test: C++ — static_assert, sizeof, alignof
// @expect-exit: 0
// @expect-contains: sizeof char=1
// @expect-contains: sizeof int=4
// @expect-contains: sizeof double=8
// @expect-contains: static_assert passed
#include <cstdio>
#include <cstdint>

int main() {
    static_assert(sizeof(char) == 1, "char must be 1 byte");
    static_assert(sizeof(int32_t) == 4, "int32_t must be 4 bytes");
    static_assert(sizeof(int64_t) == 8, "int64_t must be 8 bytes");

    printf("sizeof char=%d\n", (int)sizeof(char));
    printf("sizeof int=%d\n", (int)sizeof(int));
    printf("sizeof double=%d\n", (int)sizeof(double));
    printf("static_assert passed\n");
    return 0;
}
