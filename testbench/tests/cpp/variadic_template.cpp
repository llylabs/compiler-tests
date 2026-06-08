#include <stdio.h>

// Base case
void print_all() {
    printf("\n");
}

// Variadic template - recursive unpacking
template<typename T, typename... Rest>
void print_all(T first, Rest... rest) {
    printf("%d", first);
    if (sizeof...(rest) > 0) printf(", ");
    print_all(rest...);
}

// Variadic sum
template<typename T>
T sum(T val) { return val; }

template<typename T, typename... Rest>
T sum(T first, Rest... rest) {
    return first + sum(rest...);
}

// sizeof... operator
template<typename... Args>
int count_args(Args... args) {
    return sizeof...(Args);
}

// Variadic max
template<typename T>
T max_of(T a) { return a; }

template<typename T, typename... Rest>
T max_of(T first, Rest... rest) {
    T rest_max = max_of(rest...);
    return first > rest_max ? first : rest_max;
}

int main() {
    printf("print: ");
    print_all(1, 2, 3, 4, 5);

    printf("sum(1..5): %d\n", sum(1, 2, 3, 4, 5));
    printf("sum(10,20): %d\n", sum(10, 20));

    printf("count(a,b,c): %d\n", count_args(1, 2, 3));
    printf("count(): %d\n", count_args());

    printf("max(3,7,2,9,1): %d\n", max_of(3, 7, 2, 9, 1));

    return 0;
}
