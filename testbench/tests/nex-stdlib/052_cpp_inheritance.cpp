// Test: C++ — inheritance, virtual functions, polymorphism
// @expect-exit: 0
// @expect-contains: Dog says: Woof!
// @expect-contains: Cat says: Meow!
// @expect-contains: Dog legs: 4
// @expect-contains: Cat legs: 4
#include <cstdio>

class Animal {
public:
    virtual const char* speak() const = 0;
    virtual int legs() const { return 4; }
    virtual ~Animal() {}
};

class Dog : public Animal {
public:
    const char* speak() const override { return "Woof!"; }
};

class Cat : public Animal {
public:
    const char* speak() const override { return "Meow!"; }
};

void describe(const Animal& a, const char* name) {
    printf("%s says: %s\n", name, a.speak());
    printf("%s legs: %d\n", name, a.legs());
}

int main() {
    Dog d;
    Cat c;
    describe(d, "Dog");
    describe(c, "Cat");
    return 0;
}
