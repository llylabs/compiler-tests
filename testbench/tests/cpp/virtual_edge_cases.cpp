#include <stdio.h>

// Virtual call during construction
struct Logger {
    virtual const char *tag() { return "Logger"; }
    Logger() {
        // During construction, virtual dispatch uses THIS class's vtable
        printf("ctor tag: %s\n", tag());
    }
    virtual ~Logger() {
        printf("dtor tag: %s\n", tag());
    }
};

struct FileLogger : Logger {
    const char *tag() { return "FileLogger"; }
    FileLogger() { printf("FileLogger ctor tag: %s\n", tag()); }
    ~FileLogger() { printf("FileLogger dtor tag: %s\n", tag()); }
};

// Covariant return types
struct Base {
    virtual Base *clone() const {
        printf("Base::clone\n");
        return new Base(*this);
    }
    virtual ~Base() {}
    int val;
    Base(int v = 0) : val(v) {}
};

struct Derived : Base {
    Derived *clone() const {  // Covariant: returns Derived* not Base*
        printf("Derived::clone\n");
        return new Derived(*this);
    }
    Derived(int v = 0) : Base(v) {}
};

// Virtual dispatch with deep hierarchy
struct A { virtual int f() { return 1; } virtual ~A() {} };
struct B : A { int f() { return 2; } };
struct C : B { int f() { return 3; } };
struct D : C { }; // Does NOT override f
struct E : D { int f() { return 5; } };

// Non-virtual hiding
struct Parent {
    void method() { printf("Parent::method\n"); }
    virtual void vmethod() { printf("Parent::vmethod\n"); }
};
struct Child : Parent {
    void method() { printf("Child::method\n"); } // hides, not overrides
    void vmethod() { printf("Child::vmethod\n"); } // overrides
};

int main() {
    // Virtual dispatch during construction/destruction
    printf("--- ctor/dtor dispatch ---\n");
    {
        FileLogger fl;
    }

    // Covariant return
    printf("--- covariant ---\n");
    Base *b = new Derived(42);
    Base *b2 = b->clone();
    printf("cloned val: %d\n", b2->val);
    delete b;
    delete b2;

    // Deep hierarchy dispatch
    printf("--- deep hierarchy ---\n");
    A *ptrs[] = { new A(), new B(), new C(), new D(), new E() };
    for (int i = 0; i < 5; i++) {
        printf("f() = %d\n", ptrs[i]->f());
        delete ptrs[i];
    }

    // Non-virtual hiding vs virtual override
    printf("--- hiding vs override ---\n");
    Child c;
    Parent *pp = &c;
    c.method();      // Child::method (static dispatch)
    pp->method();    // Parent::method (non-virtual, static dispatch)
    c.vmethod();     // Child::vmethod
    pp->vmethod();   // Child::vmethod (virtual dispatch)

    return 0;
}
