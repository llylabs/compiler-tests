#include <stdio.h>

class Secret {
    int value;
    friend void reveal(const Secret &s);
    friend class Inspector;
public:
    Secret(int v) : value(v) {}
};

void reveal(const Secret &s) {
    printf("friend func: %d\n", s.value);
}

class Inspector {
public:
    static int inspect(const Secret &s) { return s.value; }
    void modify(Secret &s, int v) { s.value = v; }
};

class Pair {
    int a, b;
    friend bool operator==(const Pair &x, const Pair &y);
public:
    Pair(int a, int b) : a(a), b(b) {}
    void print() const { printf("(%d,%d)\n", a, b); }
};

bool operator==(const Pair &x, const Pair &y) {
    return x.a == y.a && x.b == y.b;
}

int main() {
    Secret s(42);
    reveal(s);

    Inspector insp;
    printf("inspect: %d\n", Inspector::inspect(s));
    insp.modify(s, 99);
    printf("modified: %d\n", Inspector::inspect(s));

    Pair p1(1, 2), p2(1, 2), p3(3, 4);
    printf("p1==p2: %d\n", p1 == p2);
    printf("p1==p3: %d\n", p1 == p3);

    return 0;
}
