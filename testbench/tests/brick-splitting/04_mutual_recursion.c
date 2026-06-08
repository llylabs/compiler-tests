// Test: Mutual recursion (SCC — both functions must be in same brick)
// @expect-exit: 0
// @expect-contains: 1
#include <stdio.h>
int is_even(int n);
int is_odd(int n);
int is_even(int n) { return n == 0 ? 1 : is_odd(n - 1); }
int is_odd(int n) { return n == 0 ? 0 : is_even(n - 1); }
int main() {
    printf("%d\n", is_even(10));
    return 0;
}
