// Test: Callback/higher-order function pattern (function pointers + indirect calls)
// @expect-exit: 0
// @expect-contains: sum=15 product=120
#include <stdio.h>
typedef int (*reducer_t)(int, int);
int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }
int reduce(int *arr, int n, int init, reducer_t fn) {
    int acc = init;
    for (int i = 0; i < n; i++) acc = fn(acc, arr[i]);
    return acc;
}
int main() {
    int arr[] = {1, 2, 3, 4, 5};
    printf("sum=%d product=%d\n", reduce(arr, 5, 0, add), reduce(arr, 5, 1, mul));
    return 0;
}
