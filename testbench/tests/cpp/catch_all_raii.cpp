#include <stdio.h>

static int alive = 0;

struct Tracker {
    int id;
    Tracker(int i) : id(i) { alive++; printf("constructed %d: alive=%d\n", id, alive); }
    ~Tracker() { alive--; printf("destructed %d: alive=%d\n", id, alive); }
};

void thrower() {
    Tracker t(1);
    printf("about to throw\n");
    throw 42;
}

void middle() {
    Tracker t(2);
    try {
        thrower();
    } catch (...) {
        printf("catch all: alive=%d\n", alive);
        throw; // rethrow
    }
}

int main() {
    try {
        middle();
    } catch (int val) {
        printf("outer catch: %d alive=%d\n", val, alive);
    }
    printf("final: alive=%d\n", alive);
    return 0;
}
