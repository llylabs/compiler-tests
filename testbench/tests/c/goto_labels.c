#include <stdio.h>

int main() {
    // Simple goto
    int i = 0;
    printf("counting:");
loop:
    if (i >= 5) goto done;
    printf(" %d", i);
    i++;
    goto loop;
done:
    printf("\n");

    // Goto skipping initialization
    int x = 10;
    if (x > 5) goto skip;
    x = 999; // should not execute
skip:
    printf("x = %d\n", x);

    // Nested goto for matrix search
    int matrix[3][3] = {{1,2,3},{4,5,6},{7,8,9}};
    int target = 5;
    int found_r = -1, found_c = -1;
    for (int r = 0; r < 3; r++) {
        for (int c = 0; c < 3; c++) {
            if (matrix[r][c] == target) {
                found_r = r;
                found_c = c;
                goto found;
            }
        }
    }
found:
    printf("found %d at (%d,%d)\n", target, found_r, found_c);

    // State machine with goto
    int state = 0;
    int result = 0;
state_a:
    result += 1;
    if (state++ < 3) goto state_a;
    printf("state machine: %d\n", result);

    return 0;
}
