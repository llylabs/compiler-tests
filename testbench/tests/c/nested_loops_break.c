#include <stdio.h>

int main() {
    // Nested loops with break
    printf("break inner:\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 5; j++) {
            if (j == 3) break;
            printf("(%d,%d) ", i, j);
        }
        printf("\n");
    }

    // Continue in nested loops
    printf("continue:\n");
    for (int i = 0; i < 4; i++) {
        if (i == 2) continue;
        printf("%d ", i);
    }
    printf("\n");

    // While + do-while combination
    int n = 1;
    int sum = 0;
    do {
        int inner = 0;
        while (inner < n) {
            sum += inner;
            inner++;
        }
        n++;
    } while (n <= 4);
    printf("nested sum: %d\n", sum);

    // Early return from nested loop via goto
    int product = 1;
    for (int i = 1; i <= 5; i++) {
        for (int j = 1; j <= 5; j++) {
            product = i * j;
            if (product > 12) goto out;
        }
    }
out:
    printf("first product > 12: %d\n", product);

    return 0;
}
