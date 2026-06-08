// Test: C++ — multiple inheritance, virtual base classes
// @expect-exit: 0
// @expect-contains: Flyable: can fly
// @expect-contains: Swimmable: can swim
// @expect-contains: Duck: quack, fly and swim
#include <cstdio>

class Flyable {
public:
    virtual void fly() const { printf("Flyable: can fly\n"); }
    virtual ~Flyable() {}
};

class Swimmable {
public:
    virtual void swim() const { printf("Swimmable: can swim\n"); }
    virtual ~Swimmable() {}
};

class Duck : public Flyable, public Swimmable {
public:
    void describe() const {
        printf("Duck: quack, fly and swim\n");
    }
};

int main() {
    Duck d;
    d.fly();
    d.swim();
    d.describe();
    return 0;
}
