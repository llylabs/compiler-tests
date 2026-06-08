// Test: C++ — aggregate initialization, designated initializers (C++20)
// @expect-exit: 0
// @expect-contains: p1: 1 2 3
// @expect-contains: p2: 10 20 0
// @expect-contains: arr: 1 2 3 0 0
#include <cstdio>

struct Point3D {
    int x, y, z;
};

int main() {
    // Aggregate init
    Point3D p1 = {1, 2, 3};
    printf("p1: %d %d %d\n", p1.x, p1.y, p1.z);

    // Partial init (zero-initialized remainder)
    Point3D p2 = {10, 20};
    printf("p2: %d %d %d\n", p2.x, p2.y, p2.z);

    // Array aggregate
    int arr[5] = {1, 2, 3};
    printf("arr:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    return 0;
}
