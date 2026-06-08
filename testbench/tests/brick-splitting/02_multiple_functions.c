// Test: Multiple independent functions — verify all callable
// @expect-exit: 0
// @expect-contains: 15
#include <stdio.h>
int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }
int sub(int a, int b) { return a - b; }
int main() {
    int r = add(mul(3, 4), sub(10, 7));
    printf("%d\n", r);
    return 0;
}
