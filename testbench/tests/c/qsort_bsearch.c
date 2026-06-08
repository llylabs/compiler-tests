#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int cmp_int(const void *a, const void *b) {
    return *(const int *)a - *(const int *)b;
}

int cmp_str(const void *a, const void *b) {
    return strcmp(*(const char **)a, *(const char **)b);
}

int main() {
    // qsort integers
    int nums[] = {42, 7, 13, 99, 1, 55, 23};
    int n = 7;
    qsort(nums, n, sizeof(int), cmp_int);
    printf("sorted:");
    for (int i = 0; i < n; i++) printf(" %d", nums[i]);
    printf("\n");

    // bsearch
    int key = 42;
    int *found = (int *)bsearch(&key, nums, n, sizeof(int), cmp_int);
    printf("found 42: %s\n", found ? "yes" : "no");
    key = 50;
    found = (int *)bsearch(&key, nums, n, sizeof(int), cmp_int);
    printf("found 50: %s\n", found ? "yes" : "no");

    // qsort strings
    const char *words[] = {"banana", "apple", "cherry", "date"};
    qsort(words, 4, sizeof(char *), cmp_str);
    printf("words:");
    for (int i = 0; i < 4; i++) printf(" %s", words[i]);
    printf("\n");

    return 0;
}
