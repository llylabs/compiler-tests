// Test: stdlib.h — qsort
// @expect-exit: 0
// @expect-contains: sorted: 1 2 3 4 5 6 7 8 9 10
// @expect-contains: reverse: 10 9 8 7 6 5 4 3 2 1
#include <stdio.h>
#include <stdlib.h>

int cmp_asc(const void *a, const void *b) {
    return *(const int *)a - *(const int *)b;
}

int cmp_desc(const void *a, const void *b) {
    return *(const int *)b - *(const int *)a;
}

int main() {
    int arr[] = {5, 3, 8, 1, 9, 2, 7, 4, 10, 6};
    int n = sizeof(arr) / sizeof(arr[0]);

    qsort(arr, n, sizeof(int), cmp_asc);
    printf("sorted:");
    for (int i = 0; i < n; i++) printf(" %d", arr[i]);
    printf("\n");

    qsort(arr, n, sizeof(int), cmp_desc);
    printf("reverse:");
    for (int i = 0; i < n; i++) printf(" %d", arr[i]);
    printf("\n");

    return 0;
}
