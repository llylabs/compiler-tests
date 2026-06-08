#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Triple pointer indirection
void set_via_ppp(int ***ppp, int val) {
    ***ppp = val;
}

// Array of function pointers returning function pointers
typedef int (*Op)(int, int);
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

typedef Op (*OpSelector)(int);
Op select_op(int which) { return which == 0 ? add : sub; }

// Struct containing pointer to same type (recursive)
struct Node {
    int val;
    struct Node *left, *right, *parent;
};

// Pointer to array vs array of pointers
void test_pointer_types() {
    int arr[3][4] = {{1,2,3,4},{5,6,7,8},{9,10,11,12}};

    // Pointer to array of 4 ints
    int (*ptr_to_arr)[4] = arr;
    printf("ptr_to_arr[1][2] = %d\n", ptr_to_arr[1][2]);

    // Array decayed to pointer
    int *flat = &arr[0][0];
    printf("flat[6] = %d\n", flat[6]);
}

// Pointer casting and aliasing
void test_aliasing() {
    int x = 0x41424344;
    char *cp = (char *)&x;
    // Read individual bytes (little-endian on WASM)
    printf("byte0=0x%02X byte1=0x%02X\n", (unsigned char)cp[0], (unsigned char)cp[1]);

    // Write through different pointer type
    unsigned short *sp = (unsigned short *)&x;
    sp[0] = 0x5555;
    printf("after short write: 0x%08X\n", (unsigned int)x);
}

// Void pointer arithmetic via cast
void *add_offset(void *base, int offset) {
    return (char *)base + offset;
}

// Restrict-like pattern (separate read/write pointers)
void copy_ints(int * dst, const int * src, int n) {
    for (int i = 0; i < n; i++) dst[i] = src[i];
}

int main() {
    // Triple pointer
    int val = 0;
    int *p = &val;
    int **pp = &p;
    int ***ppp = &pp;
    set_via_ppp(ppp, 42);
    printf("triple ptr: %d\n", val);

    // Function pointer returning function pointer
    OpSelector sel = select_op;
    Op op = sel(0);
    printf("sel(0)(3,4) = %d\n", op(3, 4));
    op = sel(1);
    printf("sel(1)(3,4) = %d\n", op(3, 4));

    // Recursive struct with parent pointer
    struct Node root = {1, NULL, NULL, NULL};
    struct Node left = {2, NULL, NULL, &root};
    struct Node right = {3, NULL, NULL, &root};
    root.left = &left;
    root.right = &right;
    printf("root=%d left=%d right=%d\n", root.val, root.left->val, root.right->val);
    printf("left->parent=%d\n", left.parent->val);

    test_pointer_types();
    test_aliasing();

    // Void pointer offset
    int arr[] = {10, 20, 30, 40};
    int *elem = (int *)add_offset(arr, 2 * sizeof(int));
    printf("offset: %d\n", *elem);

    // Copy via separate pointers
    int src[] = {1, 2, 3};
    int dst[3];
    copy_ints(dst, src, 3);
    printf("copied: %d %d %d\n", dst[0], dst[1], dst[2]);

    return 0;
}
