#include <stdio.h>

static int order_log[10];
static int order_idx = 0;

struct InitTracker {
    int id;
    InitTracker(int i) : id(i) {
        order_log[order_idx++] = id;
    }
};

// Static init order within a TU follows declaration order
static InitTracker first(1);
static InitTracker second(2);
static InitTracker third(3);

// Static local init (guaranteed once)
int &get_counter() {
    static int counter = 100;
    return counter;
}

// Dependent static init
static int a = 10;
static int b = a + 5;
static int c = b * 2;

int main() {
    // Check declaration-order initialization
    printf("init order:");
    for (int i = 0; i < order_idx; i++) {
        printf(" %d", order_log[i]);
    }
    printf("\n");

    // Dependent statics
    printf("a=%d b=%d c=%d\n", a, b, c);

    // Static local (lazy init)
    int &ref = get_counter();
    printf("counter: %d\n", ref);
    ref = 200;
    printf("modified: %d\n", get_counter());

    // Verify it's the same object
    printf("same: %d\n", &ref == &get_counter());

    return 0;
}
