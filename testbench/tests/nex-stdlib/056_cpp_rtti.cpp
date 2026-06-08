// Test: C++ — RTTI (typeid, dynamic_cast)
// @expect-exit: 0
// @expect-contains: typeid int
// @expect-contains: typeid double
// @expect-contains: base is derived: ok
// @expect-contains: base is not other: ok
#include <cstdio>
#include <typeinfo>

class Base {
public:
    virtual ~Base() {}
};

class Derived : public Base {};
class Other : public Base {};

int main() {
    // typeid on primitives
    printf("typeid int: %s\n", typeid(int).name());
    printf("typeid double: %s\n", typeid(double).name());

    // dynamic_cast
    Base* b = new Derived();
    Derived* d = dynamic_cast<Derived*>(b);
    printf("base is derived: %s\n", d ? "ok" : "FAIL");

    Other* o = dynamic_cast<Other*>(b);
    printf("base is not other: %s\n", !o ? "ok" : "FAIL");

    delete b;
    return 0;
}
