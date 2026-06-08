// Test: Functions sharing a global variable (ShouldGroup constraint)
// @expect-exit: 0
// @expect-contains: 70
#include <stdio.h>
int counter = 0;
void increment(int n) { for (int i = 0; i < n; i++) counter++; }
void decrement(int n) { for (int i = 0; i < n; i++) counter--; }
int get() { return counter; }
int main() {
    increment(100);
    decrement(30);
    printf("%d\n", get());
    return 0;
}
