#include <stdio.h>

static_assert(sizeof(int) == 4, "int must be 4 bytes");
static_assert(sizeof(char) == 1, "char must be 1 byte");
static_assert(sizeof(short) == 2, "short must be 2 bytes");
static_assert(sizeof(long long) == 8, "long long must be 8 bytes");
static_assert(sizeof(float) == 4, "float must be 4 bytes");
static_assert(sizeof(double) == 8, "double must be 8 bytes");
static_assert(sizeof(void *) == 4, "pointer must be 4 bytes on wasm32");

struct Empty {};
struct OneInt { int x; };
struct TwoInts { int x, y; };
struct Mixed { char a; int b; char c; };

template<typename T>
void print_size(const char *name) {
    printf("sizeof(%s) = %d, alignof = %d\n", name, (int)sizeof(T), (int)alignof(T));
}

int main() {
    // Basic sizes
    printf("char=%d short=%d int=%d long=%d ptr=%d\n",
           (int)sizeof(char), (int)sizeof(short), (int)sizeof(int),
           (int)sizeof(long), (int)sizeof(void *));
    printf("float=%d double=%d\n", (int)sizeof(float), (int)sizeof(double));

    // Struct sizes
    print_size<Empty>("Empty");
    print_size<OneInt>("OneInt");
    print_size<TwoInts>("TwoInts");
    print_size<Mixed>("Mixed");

    // Array sizes
    int arr[10];
    printf("arr[10]: sizeof=%d count=%d\n", (int)sizeof(arr), (int)(sizeof(arr) / sizeof(arr[0])));

    // alignof
    printf("alignof(int)=%d alignof(double)=%d\n", (int)alignof(int), (int)alignof(double));

    printf("ok\n");
    return 0;
}
