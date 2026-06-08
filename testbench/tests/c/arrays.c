#include <stdio.h>

int main() {
    int arr[] = {5, 3, 8, 1, 9, 2, 7, 4, 6};
    int n = sizeof(arr) / sizeof(arr[0]);

    // Bubble sort
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j+1]) {
                int tmp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = tmp;
            }

    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);
    printf("\n");
    return 0;
}
