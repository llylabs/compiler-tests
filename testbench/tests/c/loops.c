#include <stdio.h>

int main() {
    // for
    int sum = 0;
    for (int i = 1; i <= 100; i++) sum += i;
    printf("%d\n", sum);

    // while
    int n = 1;
    while (n < 1000) n *= 2;
    printf("%d\n", n);

    // do-while
    int x = 5;
    do { x *= 3; } while (x < 100);
    printf("%d\n", x);

    return 0;
}
