#include <stdio.h>
#include <typeinfo>

struct Animal {
    virtual const char *speak() { return "..."; }
    virtual ~Animal() {}
};

struct Dog : Animal {
    const char *speak() { return "woof"; }
};

struct Cat : Animal {
    const char *speak() { return "meow"; }
};

int main() {
    // Same type comparison
    printf("int==int: %d\n", typeid(int) == typeid(int));
    printf("int==double: %d\n", typeid(int) == typeid(double));

    // Polymorphic typeid (through pointer)
    Animal *a = new Dog();
    Animal *b = new Cat();
    Animal *c = new Animal();

    printf("a is Dog: %d\n", typeid(*a) == typeid(Dog));
    printf("b is Cat: %d\n", typeid(*b) == typeid(Cat));
    printf("c is Animal: %d\n", typeid(*c) == typeid(Animal));
    printf("a is Animal: %d\n", typeid(*a) == typeid(Animal));

    // typeid name (implementation-defined but non-empty)
    const char *name = typeid(*a).name();
    printf("name not empty: %d\n", name[0] != '\0');

    // Static vs dynamic typeid
    Dog d;
    Animal &ref = d;
    printf("static: %d\n", typeid(Dog) == typeid(Dog));
    printf("dynamic ref: %d\n", typeid(ref) == typeid(Dog));

    delete a; delete b; delete c;
    printf("done\n");
    return 0;
}
