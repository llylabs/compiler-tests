#include <stdio.h>

template<typename T>
T max_of(T a, T b) {
    return (a > b) ? a : b;
}

template<typename T>
T min_of(T a, T b) {
    return (a < b) ? a : b;
}

int main() {
    printf("%d\n", max_of(10, 20));
    printf("%d\n", min_of(10, 20));
    printf("%d\n", max_of(-5, -10));
    return 0;
}
