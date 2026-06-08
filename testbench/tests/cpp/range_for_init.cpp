#include <stdio.h>

// Minimal iterable for range-based for
struct IntArray {
    int data[10];
    int len;
    IntArray() : len(0) {}
    void add(int v) { data[len++] = v; }
    int *begin() { return data; }
    int *end() { return data + len; }
    const int *begin() const { return data; }
    const int *end() const { return data + len; }
};

int main() {
    // Range-based for with C-array
    int arr[] = {10, 20, 30, 40, 50};
    printf("array:");
    for (auto x : arr) {
        printf(" %d", x);
    }
    printf("\n");

    // Range-based for with custom type
    IntArray ia;
    ia.add(1); ia.add(2); ia.add(3);
    printf("custom:");
    for (auto x : ia) {
        printf(" %d", x);
    }
    printf("\n");

    // Range-based for with reference (modify in place)
    for (auto &x : ia) {
        x *= 10;
    }
    printf("modified:");
    for (const auto &x : ia) {
        printf(" %d", x);
    }
    printf("\n");

    // Aggregate / brace initialization
    struct Point { int x, y; };
    Point p{3, 4};
    printf("point: %d,%d\n", p.x, p.y);

    // Array brace init
    int nums[]{5, 10, 15};
    int sum = 0;
    for (auto n : nums) sum += n;
    printf("sum: %d\n", sum);

    // Initializer in if-statement (C++17)
    if (int val = 42; val > 0) {
        printf("if-init: %d\n", val);
    }

    return 0;
}
