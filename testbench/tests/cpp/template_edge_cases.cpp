#include <stdio.h>

// SFINAE-like: enable based on type properties
template<typename T>
struct is_integral { static const bool value = false; };
template<> struct is_integral<int> { static const bool value = true; };
template<> struct is_integral<long> { static const bool value = true; };
template<> struct is_integral<char> { static const bool value = true; };

// Recursive template (compile-time computation)
template<int N>
struct Factorial {
    static const int value = N * Factorial<N - 1>::value;
};
template<>
struct Factorial<0> {
    static const int value = 1;
};

// Template template parameter
template<typename T, template<typename> class Container>
struct Wrapper {
    Container<T> inner;
    void add(T val) { inner.push(val); }
    T top() const { return inner.peek(); }
};

template<typename T>
struct SimpleStack {
    T data[10];
    int sz;
    SimpleStack() : sz(0) {}
    void push(T v) { data[sz++] = v; }
    T peek() const { return data[sz - 1]; }
};

// Dependent name disambiguation
template<typename T>
struct Traits {
    typedef T value_type;
    static const int size = sizeof(T);
};

template<typename T>
void print_traits() {
    printf("size of type: %d\n", Traits<T>::size);
}

// Non-type template parameter
template<int Size>
struct FixedArray {
    int data[Size];
    void fill(int val) { for (int i = 0; i < Size; i++) data[i] = val; }
    int sum() const {
        int s = 0;
        for (int i = 0; i < Size; i++) s += data[i];
        return s;
    }
};

// Template with default parameter
template<typename T = int, int N = 10>
struct Buffer {
    T data[N];
    int count() const { return N; }
};

// Two-phase: use before definition in template
// Forward declares required for clang two-phase lookup conformance.
int helper(int x);
int helper(double x);

template<typename T>
int double_val(T x) {
    return helper(x);  // depends on T
}

int helper(int x) { return x * 2; }
int helper(double x) { return (int)(x * 2); }

int main() {
    // Type traits
    printf("int integral: %d\n", is_integral<int>::value);
    printf("double integral: %d\n", is_integral<double>::value);
    printf("char integral: %d\n", is_integral<char>::value);

    // Compile-time computation
    printf("5! = %d\n", Factorial<5>::value);
    printf("10! = %d\n", Factorial<10>::value);
    printf("0! = %d\n", Factorial<0>::value);

    // Template template parameter
    Wrapper<int, SimpleStack> w;
    w.add(10);
    w.add(20);
    printf("wrapper top: %d\n", w.top());

    // Dependent names
    print_traits<int>();
    print_traits<double>();

    // Non-type template parameter
    FixedArray<5> fa;
    fa.fill(7);
    printf("fixed sum: %d\n", fa.sum());

    // Default template params
    Buffer<> b1;
    printf("default buffer: %d\n", b1.count());
    Buffer<double, 3> b2;
    printf("custom buffer: %d\n", b2.count());

    // Dependent lookup
    printf("double_val(21) = %d\n", double_val(21));
    printf("double_val(3.5) = %d\n", double_val(3.5));

    return 0;
}
