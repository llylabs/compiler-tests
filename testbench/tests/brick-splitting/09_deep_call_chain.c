// Test: Deep call chain — a calls b calls c calls d calls e
// @expect-exit: 0
// @expect-contains: 120
#include <stdio.h>
int e(int n) { return n; }
int d(int n) { return e(n) * 5; }
int c(int n) { return d(n) * 4; }
int b(int n) { return c(n) * 3; }
int a(int n) { return b(n) * 2; }
int main() {
    printf("%d\n", a(1));
    return 0;
}
