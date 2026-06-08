// Test: Hot loop calling functions (loop body ShouldGroup constraint)
// @expect-exit: 0
// @expect-contains: 385
#include <stdio.h>
int square(int x) { return x * x; }
int main() {
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += square(i);
    }
    printf("%d\n", sum);
    return 0;
}
