#include <stdio.h>
#include <stdlib.h>

void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int main() {
    int x = 10, y = 20;
    swap(&x, &y);
    printf("%d %d\n", x, y);

    int *arr = malloc(3 * sizeof(int));
    arr[0] = 100; arr[1] = 200; arr[2] = 300;
    printf("%d %d %d\n", arr[0], arr[1], arr[2]);
    free(arr);
    return 0;
}
