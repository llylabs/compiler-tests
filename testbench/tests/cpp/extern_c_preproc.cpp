#include <stdio.h>

// Preprocessor macros
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define SQUARE(x) ((x) * (x))
#define STRINGIFY(x) #x
#define CONCAT(a, b) a##b

// Conditional compilation
#ifdef __cplusplus
#define LANG "C++"
#else
#define LANG "C"
#endif

#define VERSION 17

// Extern "C" linkage
extern "C" {
    int c_add(int a, int b) { return a + b; }
    int c_mul(int a, int b) { return a * b; }
}

// Inline function
inline int fast_abs(int x) { return x < 0 ? -x : x; }

int CONCAT(my, _func)(int x) { return x * 2; }

int main() {
    // Macro tests
    printf("MAX(3,7): %d\n", MAX(3, 7));
    printf("MIN(3,7): %d\n", MIN(3, 7));
    printf("SQUARE(5): %d\n", SQUARE(5));
    printf("lang: %s\n", LANG);

    // Conditional compilation
#if VERSION >= 17
    printf("version >= 17\n");
#else
    printf("version < 17\n");
#endif

    // Extern C functions
    printf("c_add: %d\n", c_add(10, 20));
    printf("c_mul: %d\n", c_mul(6, 7));

    // Inline
    printf("abs(-42): %d\n", fast_abs(-42));
    printf("abs(42): %d\n", fast_abs(42));

    // Token pasting
    printf("concat: %d\n", my_func(21));

    // __LINE__ and __FILE__ exist
    printf("has line: %d\n", __LINE__ > 0);

    return 0;
}
