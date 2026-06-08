#include <stdio.h>

typedef int (*IntFunc)(int);

void apply_array(int *arr, int n, int (*fn)(int)) {
    for (int i = 0; i < n; i++) arr[i] = fn(arr[i]);
}

int main() {
    // Simple lambda
    auto greet = []() { printf("hello from lambda\n"); };
    greet();

    // Lambda with params
    auto add = [](int a, int b) { return a + b; };
    printf("add: %d\n", add(3, 4));

    // Capture by value
    int x = 10;
    auto capture_val = [x]() { return x * 2; };
    printf("capture val: %d\n", capture_val());
    x = 999; // doesn't affect captured value
    printf("after change: %d\n", capture_val());

    // Capture by reference
    int counter = 0;
    auto inc = [&counter]() { counter++; };
    inc(); inc(); inc();
    printf("counter: %d\n", counter);

    // Lambda as function pointer (non-capturing only)
    int arr[] = {1, 2, 3, 4, 5};
    apply_array(arr, 5, [](int x) { return x * x; });
    printf("squared:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    // Immediately invoked
    int result = [](int a, int b) { return a * b; }(6, 7);
    printf("iife: %d\n", result);

    // Nested lambda
    auto outer = [](int x) {
        auto inner = [](int y) { return y + 1; };
        return inner(x) * 2;
    };
    printf("nested: %d\n", outer(5));

    return 0;
}
