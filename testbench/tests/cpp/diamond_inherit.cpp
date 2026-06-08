#include <stdio.h>

struct Base {
    int val;
    Base() : val(0) { printf("Base()\n"); }
    virtual ~Base() { printf("~Base()\n"); }
    virtual void identify() { printf("Base val=%d\n", val); }
};

struct Left : virtual Base {
    Left() { val = 10; printf("Left()\n"); }
    ~Left() { printf("~Left()\n"); }
    void identify() { printf("Left val=%d\n", val); }
};

struct Right : virtual Base {
    Right() { val = 20; printf("Right()\n"); }
    ~Right() { printf("~Right()\n"); }
    void identify() { printf("Right val=%d\n", val); }
};

struct Diamond : Left, Right {
    Diamond() { val = 30; printf("Diamond()\n"); }
    ~Diamond() { printf("~Diamond()\n"); }
    void identify() { printf("Diamond val=%d\n", val); }
};

int main() {
    printf("--- create ---\n");
    Diamond d;
    printf("--- calls ---\n");
    d.identify();

    // Upcast to both bases
    Left *l = &d;
    Right *r = &d;
    Base *b = &d;
    l->identify();
    r->identify();
    b->identify();

    // Single Base instance check
    l->val = 99;
    printf("after l->val=99: r->val=%d b->val=%d\n", r->val, b->val);

    printf("--- destroy ---\n");
    return 0;
}
