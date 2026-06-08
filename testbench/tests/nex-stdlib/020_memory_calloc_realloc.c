// Test: stdlib.h — calloc zero-init, realloc grow/shrink
// @expect-exit: 0
// @expect-contains: calloc zeroed: ok
// @expect-contains: realloc grow: ok
// @expect-contains: realloc preserves: ok
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // calloc must zero-initialize
    int *arr = calloc(100, sizeof(int));
    int all_zero = 1;
    for (int i = 0; i < 100; i++) {
        if (arr[i] != 0) { all_zero = 0; break; }
    }
    printf("calloc zeroed: %s\n", all_zero ? "ok" : "FAIL");

    // Fill with known values
    for (int i = 0; i < 100; i++) arr[i] = i;

    // realloc grow
    arr = realloc(arr, 200 * sizeof(int));
    if (arr) printf("realloc grow: ok\n");

    // Check original data preserved
    int preserved = 1;
    for (int i = 0; i < 100; i++) {
        if (arr[i] != i) { preserved = 0; break; }
    }
    printf("realloc preserves: %s\n", preserved ? "ok" : "FAIL");

    free(arr);
    return 0;
}
