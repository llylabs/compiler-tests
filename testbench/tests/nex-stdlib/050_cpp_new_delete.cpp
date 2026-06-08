// Test: C++ — new, delete, new[], delete[], placement new
// @expect-exit: 0
// @expect-contains: new int: 42
// @expect-contains: new array: 0 1 2 3 4
// @expect-contains: placement new: 99
// @expect-contains: nothrow: ok
#include <cstdio>
#include <new>

int main() {
    // Basic new/delete
    int *p = new int(42);
    printf("new int: %d\n", *p);
    delete p;

    // Array new/delete
    int *arr = new int[5];
    for (int i = 0; i < 5; i++) arr[i] = i;
    printf("new array:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");
    delete[] arr;

    // Placement new
    char buf[sizeof(int)];
    int *placed = new (buf) int(99);
    printf("placement new: %d\n", *placed);

    // nothrow
    int *q = new (std::nothrow) int(7);
    printf("nothrow: %s\n", q ? "ok" : "FAIL");
    delete q;

    return 0;
}
