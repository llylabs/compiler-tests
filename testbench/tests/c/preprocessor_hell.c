#include <stdio.h>

// Variadic macros (__VA_ARGS__)
#define LOG(fmt, ...) printf("[LOG] " fmt "\n", ##__VA_ARGS__)
#define LOG_NOARGS(fmt) printf("[LOG] " fmt "\n")

// Stringification
#define STR(x) #x
#define XSTR(x) STR(x)
#define VALUE 42

// Token pasting
#define MAKE_VAR(prefix, num) prefix##num
#define MAKE_FUNC(name) int name(int x) { return x * 2; }

MAKE_FUNC(double_it)
MAKE_FUNC(triple_hack) // actually doubles, name is misleading on purpose

// X-macro pattern
#define COLORS \
    X(RED, 0xFF0000) \
    X(GREEN, 0x00FF00) \
    X(BLUE, 0x0000FF) \
    X(WHITE, 0xFFFFFF)

// Generate enum
enum Color {
#define X(name, val) COLOR_##name = val,
    COLORS
#undef X
};

// Generate name function
const char *color_name(enum Color c) {
    switch (c) {
#define X(name, val) case val: return #name;
        COLORS
#undef X
        default: return "UNKNOWN";
    }
}

// Recursive-like macro (multi-level expansion)
#define A(x) B(x)
#define B(x) C(x)
#define C(x) ((x) + 1)

// Conditional macro
#define IS_POSITIVE(x) ((x) > 0 ? 1 : 0)
#define ABS(x) ((x) < 0 ? -(x) : (x))
#define CLAMP(x, lo, hi) ((x) < (lo) ? (lo) : ((x) > (hi) ? (hi) : (x)))

// Multi-statement macro with do-while
#define SWAP(a, b) do { \
    int _tmp = (a); \
    (a) = (b); \
    (b) = _tmp; \
} while(0)

// Sizeof in macro
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

// Predefined macros
#ifndef __STDC__
#define STDC_VAL 0
#else
#define STDC_VAL 1
#endif

int main() {
    // Variadic macros
    LOG("hello %s %d", "world", 42);
    LOG_NOARGS("simple");

    // Stringification
    printf("STR: %s\n", STR(hello));
    printf("XSTR: %s\n", XSTR(VALUE));

    // Token pasting
    int MAKE_VAR(my, _var) = 99;
    printf("pasted var: %d\n", my_var);
    printf("pasted func: %d\n", double_it(21));

    // X-macro generated code
    printf("RED: %s (0x%06X)\n", color_name(COLOR_RED), COLOR_RED);
    printf("GREEN: %s (0x%06X)\n", color_name(COLOR_GREEN), COLOR_GREEN);
    printf("BLUE: %s (0x%06X)\n", color_name(COLOR_BLUE), COLOR_BLUE);

    // Multi-level expansion
    printf("A(5) = %d\n", A(5));

    // Utility macros
    printf("ABS(-7) = %d\n", ABS(-7));
    printf("CLAMP(15,0,10) = %d\n", CLAMP(15, 0, 10));
    printf("CLAMP(-3,0,10) = %d\n", CLAMP(-3, 0, 10));
    printf("CLAMP(5,0,10) = %d\n", CLAMP(5, 0, 10));

    // Swap macro
    int a = 10, b = 20;
    SWAP(a, b);
    printf("swapped: %d %d\n", a, b);

    // Array size macro
    int arr[] = {1, 2, 3, 4, 5, 6, 7};
    printf("array size: %d\n", (int)ARRAY_SIZE(arr));

    // Predefined
    printf("STDC: %d\n", STDC_VAL);

    return 0;
}
