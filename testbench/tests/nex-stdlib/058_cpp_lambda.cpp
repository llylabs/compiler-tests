// Test: C++ — lambdas, captures, generic lambdas
// @expect-exit: 0
// @expect-contains: add(3,4)=7
// @expect-contains: capture x=10 y=20 sum=30
// @expect-contains: mutable counter: 1 2 3
// @expect-contains: sorted: 5 4 3 2 1
#include <cstdio>
#include <cstdlib>

int main() {
    // Basic lambda
    auto add = [](int a, int b) { return a + b; };
    printf("add(3,4)=%d\n", add(3, 4));

    // Capture by value and reference
    int x = 10, y = 20;
    auto cap = [x, &y]() { return x + y; };
    printf("capture x=%d y=%d sum=%d\n", x, y, cap());

    // Mutable lambda
    int count = 0;
    auto counter = [count]() mutable {
        return ++count;
    };
    printf("mutable counter: %d %d %d\n", counter(), counter(), counter());

    // Lambda as comparator for qsort
    int arr[] = {3, 1, 4, 5, 2};
    qsort(arr, 5, sizeof(int), [](const void* a, const void* b) -> int {
        return *(const int*)b - *(const int*)a;
    });
    printf("sorted:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    return 0;
}
