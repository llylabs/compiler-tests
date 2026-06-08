#include <stdio.h>

int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }

typedef int (*binop)(int, int);

int apply(binop fn, int a, int b) {
    return fn(a, b);
}

void map_array(int *arr, int n, int (*transform)(int)) {
    for (int i = 0; i < n; i++) arr[i] = transform(arr[i]);
}

int double_it(int x) { return x * 2; }
int negate(int x) { return -x; }

int main() {
    // Function pointer dispatch table
    binop ops[] = {add, sub, mul};
    const char *names[] = {"add", "sub", "mul"};
    for (int i = 0; i < 3; i++) {
        printf("%s(10,3) = %d\n", names[i], ops[i](10, 3));
    }

    // Callback via apply
    printf("apply add: %d\n", apply(add, 7, 8));
    printf("apply mul: %d\n", apply(mul, 6, 7));

    // Map with function pointer
    int arr[] = {1, 2, 3, 4, 5};
    map_array(arr, 5, double_it);
    printf("doubled:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    map_array(arr, 5, negate);
    printf("negated:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    return 0;
}
