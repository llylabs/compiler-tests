// Test: Array manipulation across functions — memory must be consistent
// @expect-exit: 0
// @expect-contains: sorted: 1 2 3 4 5
#include <stdio.h>
void fill(int *arr, int n) {
    arr[0]=5; arr[1]=3; arr[2]=1; arr[3]=4; arr[4]=2;
}
void sort(int *arr, int n) {
    for (int i = 0; i < n-1; i++)
        for (int j = 0; j < n-i-1; j++)
            if (arr[j] > arr[j+1]) {
                int t = arr[j]; arr[j] = arr[j+1]; arr[j+1] = t;
            }
}
void print_arr(int *arr, int n) {
    printf("sorted:");
    for (int i = 0; i < n; i++) printf(" %d", arr[i]);
    printf("\n");
}
int main() {
    int arr[5];
    fill(arr, 5);
    sort(arr, 5);
    print_arr(arr, 5);
    return 0;
}
