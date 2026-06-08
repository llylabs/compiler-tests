#include <stdio.h>

union IntFloat {
    int i;
    float f;
};

struct Tagged {
    int tag; // 0=int, 1=float, 2=char
    union {
        int ival;
        float fval;
        char cval;
    } data;
};

void print_tagged(struct Tagged t) {
    switch (t.tag) {
        case 0: printf("int: %d\n", t.data.ival); break;
        case 1: printf("float: %.1f\n", t.data.fval); break;
        case 2: printf("char: %c\n", t.data.cval); break;
    }
}

int main() {
    // Basic union
    union IntFloat u;
    u.i = 42;
    printf("int: %d\n", u.i);
    u.f = 3.14f;
    printf("float: %.2f\n", u.f);

    // Tagged union (discriminated)
    struct Tagged values[3];
    values[0].tag = 0; values[0].data.ival = 99;
    values[1].tag = 1; values[1].data.fval = 2.5f;
    values[2].tag = 2; values[2].data.cval = 'X';

    for (int i = 0; i < 3; i++) {
        print_tagged(values[i]);
    }

    // Union size = max member
    printf("sizeof union=%d\n", (int)sizeof(union IntFloat));

    return 0;
}
