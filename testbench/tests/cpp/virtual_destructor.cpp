#include <stdio.h>

struct Base {
    int id;
    Base(int i) : id(i) { printf("Base(%d)\n", id); }
    virtual ~Base() { printf("~Base(%d)\n", id); }
};

struct Derived : Base {
    int extra;
    Derived(int i, int e) : Base(i), extra(e) { printf("Derived(%d,%d)\n", id, extra); }
    ~Derived() { printf("~Derived(%d,%d)\n", id, extra); }
};

struct SubDerived : Derived {
    SubDerived(int i) : Derived(i, i * 10) { printf("SubDerived(%d)\n", i); }
    ~SubDerived() { printf("~SubDerived(%d)\n", id); }
};

int main() {
    // Delete through base pointer - must call derived destructor
    printf("--- base ptr delete ---\n");
    Base *p = new Derived(1, 100);
    delete p;

    printf("--- deep hierarchy ---\n");
    Base *q = new SubDerived(2);
    delete q;

    printf("--- stack ---\n");
    {
        Derived d(3, 300);
    }

    printf("done\n");
    return 0;
}
