#include <stdio.h>

struct Flags {
    unsigned int read : 1;
    unsigned int write : 1;
    unsigned int exec : 1;
    unsigned int reserved : 5;
};

struct Color {
    unsigned char r : 5;
    unsigned char g : 6;
    unsigned char b : 5;
};

union Value {
    int i;
    float f;
    char bytes[4];
};

int main() {
    // Bitfields
    Flags f;
    f.read = 1;
    f.write = 0;
    f.exec = 1;
    f.reserved = 0;
    printf("flags: r=%d w=%d x=%d\n", f.read, f.write, f.exec);

    f.write = 1;
    printf("after set: r=%d w=%d x=%d\n", f.read, f.write, f.exec);

    // Color bitfield packing
    Color c;
    c.r = 31; c.g = 63; c.b = 31; // Max values
    printf("color: r=%d g=%d b=%d\n", c.r, c.g, c.b);

    c.r = 15; c.g = 32; c.b = 8;
    printf("color2: r=%d g=%d b=%d\n", c.r, c.g, c.b);

    // Union
    Value v;
    v.i = 42;
    printf("union int: %d\n", v.i);
    v.f = 1.5f;
    printf("union float: %.1f\n", v.f);
    printf("sizeof Value: %d\n", (int)sizeof(Value));

    return 0;
}
