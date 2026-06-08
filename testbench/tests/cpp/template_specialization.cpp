#include <stdio.h>

// Primary template
template<typename T>
struct TypeName {
    static const char *name() { return "unknown"; }
};

// Full specializations
template<> struct TypeName<int> {
    static const char *name() { return "int"; }
};
template<> struct TypeName<double> {
    static const char *name() { return "double"; }
};
template<> struct TypeName<char> {
    static const char *name() { return "char"; }
};

// Function template with specialization
template<typename T>
void print_val(T val) {
    printf("[%s] generic\n", TypeName<T>::name());
}

template<>
void print_val<int>(int val) {
    printf("[int] %d\n", val);
}

template<>
void print_val<double>(double val) {
    printf("[double] %.2f\n", val);
}

// Partial specialization (class template)
template<typename T, typename U>
struct Pair {
    T first; U second;
    void print() { printf("Pair<T,U>\n"); }
};

template<typename T>
struct Pair<T, T> {
    T first; T second;
    void print() { printf("Pair<T,T> same type\n"); }
};

int main() {
    printf("int: %s\n", TypeName<int>::name());
    printf("double: %s\n", TypeName<double>::name());
    printf("char: %s\n", TypeName<char>::name());
    printf("float: %s\n", TypeName<float>::name()); // uses primary

    print_val(42);
    print_val(3.14);
    print_val('x'); // uses generic

    Pair<int, double> p1; p1.print();
    Pair<int, int> p2; p2.print();

    return 0;
}
