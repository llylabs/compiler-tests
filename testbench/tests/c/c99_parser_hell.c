#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Compound literals (C99)
struct Point { int x, y; };

void print_point(struct Point p) { printf("(%d,%d)", p.x, p.y); }

// Designated initializers (C99)
struct Config {
    int width;
    int height;
    int depth;
    int flags;
};

// Anonymous struct/union (C11)
struct Variant {
    int tag;
    union {
        int ival;
        float fval;
        struct { int x, y; }; // anonymous struct inside anonymous union
    };
};

// _Bool (C99)
#include <stdbool.h>

// Flexible array member (C99)
struct DynArray {
    int len;
    int data[];
};

int main() {
    // Compound literal as argument
    print_point((struct Point){10, 20});
    printf("\n");

    // Compound literal in expression
    int *p = (int[]){5, 10, 15, 20};
    printf("compound arr: %d %d %d %d\n", p[0], p[1], p[2], p[3]);

    // Designated initializers
    struct Config cfg = { .height = 600, .width = 800, .flags = 1 };
    printf("config: %dx%d flags=%d depth=%d\n", cfg.width, cfg.height, cfg.flags, cfg.depth);

    // Partial designated init (rest zero)
    int arr[5] = { [2] = 42, [4] = 99 };
    printf("desig arr: %d %d %d %d %d\n", arr[0], arr[1], arr[2], arr[3], arr[4]);

    // Anonymous struct/union
    struct Variant v;
    v.tag = 0; v.ival = 42;
    printf("variant int: %d\n", v.ival);
    v.tag = 2; v.x = 10; v.y = 20;
    printf("variant xy: %d %d\n", v.x, v.y);

    // _Bool
    bool a = true, b = false;
    printf("bool: %d %d %d\n", a, b, a && !b);

    // for-loop declaration (C99)
    int sum = 0;
    for (int i = 0; i < 10; i++) sum += i;
    printf("for-decl sum: %d\n", sum);

    // Flexible array member
    struct DynArray *da = (struct DynArray *)malloc(sizeof(struct DynArray) + 3 * sizeof(int));
    da->len = 3;
    da->data[0] = 100; da->data[1] = 200; da->data[2] = 300;
    printf("flex arr:");
    for (int i = 0; i < da->len; i++) printf(" %d", da->data[i]);
    printf("\n");
    free(da);

    // Nested designator
    struct { struct Point pts[2]; } nested = { .pts = { [0] = {1, 2}, [1] = {3, 4} } };
    printf("nested desig: (%d,%d) (%d,%d)\n",
           nested.pts[0].x, nested.pts[0].y, nested.pts[1].x, nested.pts[1].y);

    // Comma operator in complex expression
    int x = (1, 2, 3, 42);
    printf("comma: %d\n", x);

    // Ternary with side effects
    int c1 = 0, c2 = 0;
    int r = (c1++, 1) ? (c2++, 10) : (c2--, 20);
    printf("ternary: r=%d c1=%d c2=%d\n", r, c1, c2);

    return 0;
}
