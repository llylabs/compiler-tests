#include <stdio.h>

struct Printable {
    virtual void print() = 0;
    virtual ~Printable() {}
};

struct Serializable {
    virtual const char *serialize() = 0;
    virtual ~Serializable() {}
};

struct Data : Printable, Serializable {
    int x, y;
    Data(int x, int y) : x(x), y(y) {}

    void print() { printf("Data(%d, %d)\n", x, y); }
    const char *serialize() { return "data-serialized"; }
};

void do_print(Printable *p) { p->print(); }
const char *do_serialize(Serializable *s) { return s->serialize(); }

int main() {
    Data d(10, 20);

    // Direct
    d.print();
    printf("ser: %s\n", d.serialize());

    // Via base pointers
    do_print(&d);
    printf("via base: %s\n", do_serialize(&d));

    // Pointer identity through casts
    Printable *pp = &d;
    Serializable *ps = &d;
    printf("same object: %d\n", (void *)pp != (void *)ps || 1); // different vtable ptrs but same logical object

    return 0;
}
