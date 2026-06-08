#include <stdio.h>

void reverse_array(int *arr, int n) {
    int *left = arr;
    int *right = arr + n - 1;
    while (left < right) {
        int tmp = *left;
        *left = *right;
        *right = tmp;
        left++;
        right--;
    }
}

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int *p = arr;

    // Pointer indexing vs array indexing
    printf("p[0]=%d p[2]=%d p[4]=%d\n", p[0], p[2], p[4]);
    printf("*p=%d *(p+3)=%d\n", *p, *(p + 3));

    // Pointer difference
    int *start = &arr[0];
    int *end = &arr[4];
    printf("diff: %d\n", (int)(end - start));

    // Pointer comparison
    printf("start < end: %d\n", start < end);
    printf("start == arr: %d\n", start == arr);

    // Pointer increment in loop
    printf("via pointer:");
    for (int *q = arr; q < arr + 5; q++) {
        printf(" %d", *q);
    }
    printf("\n");

    // Reverse via pointers
    reverse_array(arr, 5);
    printf("reversed:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    // Multi-level indirection
    int x = 42;
    int *px = &x;
    int **ppx = &px;
    printf("x=%d *px=%d **ppx=%d\n", x, *px, **ppx);
    **ppx = 99;
    printf("after: x=%d\n", x);

    return 0;
}
