#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // malloc + fill
    int *arr = (int *)malloc(5 * sizeof(int));
    for (int i = 0; i < 5; i++) arr[i] = (i + 1) * 10;
    printf("malloc:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    // realloc to larger
    arr = (int *)realloc(arr, 10 * sizeof(int));
    for (int i = 5; i < 10; i++) arr[i] = (i + 1) * 10;
    printf("realloc:");
    for (int i = 0; i < 10; i++) printf(" %d", arr[i]);
    printf("\n");

    free(arr);

    // calloc (zero-initialized)
    int *zarr = (int *)calloc(4, sizeof(int));
    int all_zero = 1;
    for (int i = 0; i < 4; i++) {
        if (zarr[i] != 0) all_zero = 0;
    }
    printf("calloc zeroed: %s\n", all_zero ? "yes" : "no");
    free(zarr);

    // malloc for strings
    char *s = (char *)malloc(32);
    strcpy(s, "Hello");
    strcat(s, " World");
    printf("string: %s\n", s);
    printf("strlen: %d\n", (int)strlen(s));
    free(s);

    return 0;
}
