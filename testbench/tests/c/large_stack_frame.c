#include <stdio.h>
#include <string.h>

// Function with large local array
int sum_local_array(int n) {
    int arr[200];
    for (int i = 0; i < n && i < 200; i++) arr[i] = i + 1;
    int total = 0;
    for (int i = 0; i < n && i < 200; i++) total += arr[i];
    return total;
}

// Deep call chain
int deep(int n, int acc) {
    if (n <= 0) return acc;
    int local[10]; // Force stack allocation per frame
    for (int i = 0; i < 10; i++) local[i] = n + i;
    return deep(n - 1, acc + local[0]);
}

// Multiple large locals
void multi_arrays(void) {
    int a[50], b[50], c[50];
    for (int i = 0; i < 50; i++) {
        a[i] = i;
        b[i] = i * 2;
        c[i] = a[i] + b[i];
    }
    printf("multi: %d %d %d\n", c[0], c[25], c[49]);
}

// Nested function calls with stack-heavy frames
int matrix_trace(void) {
    int mat[10][10];
    for (int i = 0; i < 10; i++)
        for (int j = 0; j < 10; j++)
            mat[i][j] = i * 10 + j;
    int trace = 0;
    for (int i = 0; i < 10; i++) trace += mat[i][i];
    return trace;
}

int main() {
    printf("sum 100: %d\n", sum_local_array(100));
    printf("sum 200: %d\n", sum_local_array(200));
    printf("deep 50: %d\n", deep(50, 0));
    multi_arrays();
    printf("trace: %d\n", matrix_trace());

    // String on stack
    char buf[100];
    memset(buf, 0, 100);
    for (int i = 0; i < 26; i++) buf[i] = 'a' + i;
    printf("alphabet: %s\n", buf);

    return 0;
}
