// Test: C++ — cmath, cstring, cstdlib wrappers
// @expect-exit: 0
// @expect-contains: sqrt(2)=1.414
// @expect-contains: abs(-5)=5
// @expect-contains: strlen=5
// @expect-contains: strcmp=0
// @expect-contains: atoi=42
#include <cstdio>
#include <cmath>
#include <cstring>
#include <cstdlib>

int main() {
    printf("sqrt(2)=%.3f\n", std::sqrt(2.0));
    printf("abs(-5)=%d\n", std::abs(-5));
    printf("strlen=%d\n", (int)std::strlen("hello"));
    printf("strcmp=%d\n", std::strcmp("abc", "abc"));
    printf("atoi=%d\n", std::atoi("42"));
    return 0;
}
