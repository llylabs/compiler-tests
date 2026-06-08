// Test: Indirect calls via function pointers (call_indirect in WASM)
// @expect-exit: 0
// @expect-contains: 30
#include <stdio.h>
typedef int (*op_t)(int, int);
int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }
int apply(op_t fn, int a, int b) { return fn(a, b); }
int main() {
    int r1 = apply(add, 10, 20);
    int r2 = apply(mul, 3, 10);
    printf("%d\n", r1);
    return 0;
}
