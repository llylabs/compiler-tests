#include <stdio.h>
#include <stdlib.h>

typedef unsigned char byte;
typedef int (*Comparator)(const void *, const void *);

// Generic swap using void pointers
void generic_swap(void *a, void *b, int size) {
    byte *pa = (byte *)a;
    byte *pb = (byte *)b;
    for (int i = 0; i < size; i++) {
        byte tmp = pa[i];
        pa[i] = pb[i];
        pb[i] = tmp;
    }
}

int main() {
    // Integer casts
    double d = 3.7;
    int i = (int)d;
    printf("double->int: %d\n", i);

    int neg = -5;
    unsigned int u = (unsigned int)neg;
    printf("neg as uint: %u\n", u);

    float f = (float)123456789;
    printf("int->float->int: %d\n", (int)f);

    // Pointer casts (void*)
    int x = 100, y = 200;
    printf("before swap: %d %d\n", x, y);
    generic_swap(&x, &y, sizeof(int));
    printf("after swap: %d %d\n", x, y);

    // Byte-level access via cast
    int val = 0x41424344; // 'ABCD' in ASCII (little-endian)
    byte *bytes = (byte *)&val;
    printf("byte 0: 0x%02X\n", bytes[0]);

    // typedef chain
    typedef int Integer;
    typedef Integer Number;
    Number n = 42;
    printf("typedef chain: %d\n", n);

    // Cast in expressions
    int a = 7, b = 2;
    printf("int div: %d\n", a / b);
    printf("float div: %.1f\n", (double)a / (double)b);

    return 0;
}
