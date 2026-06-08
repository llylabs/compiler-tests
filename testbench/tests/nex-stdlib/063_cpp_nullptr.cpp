// Test: C++ — nullptr, nullptr_t
// @expect-exit: 0
// @expect-contains: nullptr is null: 1
// @expect-contains: overload: nullptr version
// @expect-contains: cond: null
#include <cstdio>

void foo(int) { printf("overload: int version\n"); }
void foo(int*) { printf("overload: nullptr version\n"); }

int main() {
    int* p = nullptr;
    printf("nullptr is null: %d\n", p == nullptr);

    foo(nullptr);

    const char* s = nullptr;
    printf("cond: %s\n", s ? s : "null");

    return 0;
}
