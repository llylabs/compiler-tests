#include <stdio.h>
#include <stdlib.h>

static int alloc_count = 0;
static int dealloc_count = 0;

void *operator new(unsigned long size) {
    alloc_count++;
    printf("custom new: size=%lu count=%d\n", size, alloc_count);
    return malloc(size);
}

void operator delete(void *ptr) noexcept {
    if (ptr) {
        dealloc_count++;
        printf("custom delete: count=%d\n", dealloc_count);
        free(ptr);
    }
}

void operator delete(void *ptr, unsigned long) noexcept {
    if (ptr) {
        dealloc_count++;
        printf("custom delete(sized): count=%d\n", dealloc_count);
        free(ptr);
    }
}

struct Thing {
    int value;
    Thing(int v) : value(v) { printf("Thing(%d)\n", value); }
    ~Thing() { printf("~Thing(%d)\n", value); }
};

int main() {
    // Single object
    Thing *t = new Thing(42);
    printf("t->value = %d\n", t->value);
    delete t;

    // Another object
    Thing *u = new Thing(99);
    delete u;

    // Check balance
    printf("allocs: %d deallocs: %d\n", alloc_count, dealloc_count);
    printf("balanced: %s\n", alloc_count == dealloc_count ? "yes" : "no");

    return 0;
}
