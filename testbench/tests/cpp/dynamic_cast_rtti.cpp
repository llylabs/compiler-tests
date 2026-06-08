#include <stdio.h>

struct Base {
    virtual const char *name() { return "Base"; }
    virtual ~Base() {}
};

struct Derived : Base {
    int extra;
    Derived(int e) : extra(e) {}
    const char *name() { return "Derived"; }
};

struct Other : Base {
    const char *name() { return "Other"; }
};

// Multi-inheritance for cross-cast test
struct InterfaceA {
    virtual void a_method() {}
    virtual ~InterfaceA() {}
};

struct InterfaceB {
    virtual void b_method() {}
    virtual ~InterfaceB() {}
};

struct Multi : InterfaceA, InterfaceB {
    void a_method() {}
    void b_method() {}
};

int main() {
    // Downcast success
    Base *b1 = new Derived(42);
    Derived *d1 = dynamic_cast<Derived *>(b1);
    if (d1) {
        printf("downcast ok: %s extra=%d\n", d1->name(), d1->extra);
    } else {
        printf("downcast failed\n");
    }

    // Downcast failure
    Base *b2 = new Base();
    Derived *d2 = dynamic_cast<Derived *>(b2);
    printf("failed downcast: %s\n", d2 ? "not null" : "null");

    // Wrong derived type
    Base *b3 = new Other();
    Derived *d3 = dynamic_cast<Derived *>(b3);
    printf("wrong type: %s\n", d3 ? "not null" : "null");

    // Upcast (always works)
    Derived *d4 = new Derived(10);
    Base *b4 = dynamic_cast<Base *>(d4);
    printf("upcast: %s\n", b4 ? "ok" : "fail");

    // Cross-cast with multi-inheritance
    Multi *m = new Multi();
    InterfaceA *ia = dynamic_cast<InterfaceA *>(m);
    InterfaceB *ib = dynamic_cast<InterfaceB *>(m);
    printf("multi A: %s\n", ia ? "ok" : "fail");
    printf("multi B: %s\n", ib ? "ok" : "fail");

    delete b1; delete b2; delete b3; delete d4; delete m;
    printf("done\n");
    return 0;
}
