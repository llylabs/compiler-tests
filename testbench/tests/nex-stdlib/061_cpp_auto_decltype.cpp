// Test: C++ — auto, decltype, range-based for
// @expect-exit: 0
// @expect-contains: auto int: 42
// @expect-contains: auto double: 3.140
// @expect-contains: decltype: 7
// @expect-contains: range-for: 1 2 3 4 5
// @expect-contains: range-for sum: 15
#include <cstdio>

int main() {
    auto x = 42;
    printf("auto int: %d\n", x);

    auto y = 3.14;
    printf("auto double: %.3f\n", y);

    decltype(x) z = 7;
    printf("decltype: %d\n", z);

    int arr[] = {1, 2, 3, 4, 5};
    printf("range-for:");
    for (auto v : arr) printf(" %d", v);
    printf("\n");

    int sum = 0;
    for (const auto& v : arr) sum += v;
    printf("range-for sum: %d\n", sum);

    return 0;
}
