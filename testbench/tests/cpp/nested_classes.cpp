#include <stdio.h>

struct Outer {
    int x;

    struct Inner {
        int y;
        Inner(int v) : y(v) {}
        void print() const { printf("Inner y=%d\n", y); }
    };

    Outer(int v) : x(v) {}

    Inner make_inner(int v) { return Inner(v + x); }
};

// Iterator-like nested class
struct IntRange {
    int start, end;

    struct Iterator {
        int current;
        Iterator(int c) : current(c) {}
        int operator*() const { return current; }
        Iterator &operator++() { ++current; return *this; }
        bool operator!=(const Iterator &o) const { return current != o.current; }
    };

    IntRange(int s, int e) : start(s), end(e) {}
    Iterator begin() const { return Iterator(start); }
    Iterator end_iter() const { return Iterator(end); }
};

int main() {
    Outer o(10);
    Outer::Inner i(5);
    i.print();

    Outer::Inner i2 = o.make_inner(20);
    i2.print();

    // Nested iterator pattern
    IntRange range(1, 6);
    printf("range:");
    for (IntRange::Iterator it = range.begin(); it != range.end_iter(); ++it) {
        printf(" %d", *it);
    }
    printf("\n");

    return 0;
}
