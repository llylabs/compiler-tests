// Test: stdlib.h — bsearch
// @expect-exit: 0
// @expect-contains: found 5 at index 4
// @expect-contains: 99 not found
#include <stdio.h>
#include <stdlib.h>

int cmp(const void *a, const void *b) {
    return *(const int *)a - *(const int *)b;
}

int main() {
    int arr[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int n = sizeof(arr) / sizeof(arr[0]);

    int key = 5;
    int *found = bsearch(&key, arr, n, sizeof(int), cmp);
    if (found) printf("found %d at index %d\n", *found, (int)(found - arr));

    key = 99;
    found = bsearch(&key, arr, n, sizeof(int), cmp);
    if (!found) printf("%d not found\n", key);

    return 0;
}
