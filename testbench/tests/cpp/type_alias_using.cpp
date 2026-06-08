#include <stdio.h>

// Type alias with using
using Int = int;
using IntPtr = int *;
using FuncPtr = int (*)(int, int);

int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }

// Template type alias
template<typename T>
struct Container {
    T data[10];
    int size;
    Container() : size(0) {}
    void push(T val) { data[size++] = val; }
    T get(int i) const { return data[i]; }
};

template<typename T>
using Stack = Container<T>;

// Alias for function pointer
using Comparator = int (*)(int, int);

int ascending(int a, int b) { return a - b; }

void sort3(int *a, int *b, int *c, Comparator cmp) {
    if (cmp(*a, *b) > 0) { int t = *a; *a = *b; *b = t; }
    if (cmp(*b, *c) > 0) { int t = *b; *b = *c; *c = t; }
    if (cmp(*a, *b) > 0) { int t = *a; *a = *b; *b = t; }
}

int main() {
    Int x = 42;
    printf("Int: %d\n", x);

    IntPtr p = &x;
    printf("IntPtr: %d\n", *p);

    FuncPtr f = add;
    printf("add: %d\n", f(3, 4));
    f = mul;
    printf("mul: %d\n", f(3, 4));

    Stack<int> s;
    s.push(10); s.push(20); s.push(30);
    printf("stack:");
    for (int i = 0; i < s.size; i++) printf(" %d", s.get(i));
    printf("\n");

    int a = 3, b = 1, c = 2;
    sort3(&a, &b, &c, ascending);
    printf("sorted: %d %d %d\n", a, b, c);

    return 0;
}
