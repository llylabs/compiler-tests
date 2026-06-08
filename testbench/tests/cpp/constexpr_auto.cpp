#include <stdio.h>

constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

constexpr int fibonacci(int n) {
    return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}

constexpr int square(int x) { return x * x; }

int main() {
    // constexpr evaluation
    constexpr int f5 = factorial(5);
    constexpr int f10 = factorial(10);
    printf("5! = %d\n", f5);
    printf("10! = %d\n", f10);

    constexpr int fib10 = fibonacci(10);
    printf("fib(10) = %d\n", fib10);

    // auto type deduction
    auto x = 42;
    auto y = 3.14;
    auto z = 'A';
    printf("auto int: %d\n", x);
    printf("auto double: %.2f\n", y);
    printf("auto char: %c\n", z);

    // constexpr in array size
    constexpr int N = square(3);
    int arr[N];
    for (int i = 0; i < N; i++) arr[i] = i * i;
    printf("arr[%d]:", N);
    for (int i = 0; i < N; i++) printf(" %d", arr[i]);
    printf("\n");

    // decltype
    int a = 10;
    decltype(a) b = 20;
    printf("decltype: %d\n", b);

    return 0;
}
