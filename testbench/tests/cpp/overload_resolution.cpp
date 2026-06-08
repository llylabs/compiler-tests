#include <stdio.h>

// Basic overloading
int process(int x) { return x * 2; }
double process(double x) { return x * 3.0; }
const char *process(const char *s) { return s; }

// Overload with reference types
void by_val(int x) { printf("by_val: %d\n", x); }
void by_ref(int &x) { printf("by_ref: %d\n", x); x++; }
void by_cref(const int &x) { printf("by_cref: %d\n", x); }

// Overload with inheritance
struct Base { virtual ~Base() {} };
struct Derived : Base {};

void accept(Base &b) { printf("accept Base\n"); }
void accept(Derived &d) { printf("accept Derived\n"); }

// Template vs non-template overload
template<typename T>
void show(T val) { printf("template: generic\n"); }
void show(int val) { printf("non-template: int %d\n", val); }
void show(double val) { printf("non-template: double %.1f\n", val); }

// Overload with implicit conversion
struct Wrapper {
    int val;
    Wrapper(int v) : val(v) {}  // implicit conversion from int
};

void take(Wrapper w) { printf("Wrapper: %d\n", w.val); }

// Const overload
struct Container {
    int data;
    int &get() { printf("non-const get\n"); return data; }
    const int &get() const { printf("const get\n"); return data; }
};

// Overload with different param counts
int calc(int a) { return a; }
int calc(int a, int b) { return a + b; }
int calc(int a, int b, int c) { return a + b + c; }

// Default arguments (not overloading but related resolution)
int with_default(int a, int b = 10, int c = 20) {
    return a + b + c;
}

int main() {
    // Basic
    printf("int: %d\n", process(5));
    printf("double: %.1f\n", process(2.5));
    printf("str: %s\n", process("hello"));

    // Ref overloads
    int x = 10;
    by_val(x);
    by_ref(x);
    printf("after ref: %d\n", x);
    by_cref(42); // binds to const ref

    // Inheritance
    Base b;
    Derived d;
    accept(b);
    accept(d);

    // Template vs non-template
    show(42);      // non-template preferred
    show(3.14);    // non-template preferred
    show("text");  // template (no exact match)

    // Implicit conversion
    take(42);

    // Const overload
    Container c1;
    c1.data = 5;
    c1.get() = 10;
    const Container c2 = {99};
    c2.get();

    // Param count
    printf("calc(1)=%d calc(1,2)=%d calc(1,2,3)=%d\n", calc(1), calc(1, 2), calc(1, 2, 3));

    // Default args
    printf("default: %d %d %d\n", with_default(1), with_default(1, 2), with_default(1, 2, 3));

    return 0;
}
