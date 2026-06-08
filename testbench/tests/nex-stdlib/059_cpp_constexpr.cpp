// Test: C++ — constexpr functions and variables
// @expect-exit: 0
// @expect-contains: fib(10)=55
// @expect-contains: factorial(6)=720
// @expect-contains: array size: 55
#include <cstdio>

constexpr int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

constexpr int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) result *= i;
    return result;
}

int main() {
    constexpr int f10 = fib(10);
    printf("fib(10)=%d\n", f10);

    constexpr int f6 = factorial(6);
    printf("factorial(6)=%d\n", f6);

    // Use constexpr as array size
    int arr[fib(10)];
    printf("array size: %d\n", (int)(sizeof(arr) / sizeof(arr[0])));

    return 0;
}
