#include <stdio.h>

void safe_func() noexcept {
    printf("safe_func\n");
}

int divide(int a, int b) noexcept(false) {
    if (b == 0) throw "division by zero";
    return a / b;
}

// noexcept operator
template<typename Func>
void check_noexcept(const char *name, Func) {
    printf("%s noexcept: %d\n", name, noexcept(Func()));
}

struct NoThrow {
    NoThrow() noexcept = default;
    ~NoThrow() noexcept = default;
    NoThrow(const NoThrow &) noexcept = default;
    void method() noexcept { printf("NoThrow::method\n"); }
};

struct MayThrow {
    MayThrow() {}
    void risky() { printf("MayThrow::risky\n"); }
};

int main() {
    safe_func();

    try {
        printf("10/2 = %d\n", divide(10, 2));
        printf("10/0 = %d\n", divide(10, 0));
    } catch (const char *msg) {
        printf("caught: %s\n", msg);
    }

    // noexcept operator
    printf("safe noexcept: %d\n", noexcept(safe_func()));
    printf("divide noexcept: %d\n", noexcept(divide(1, 1)));

    NoThrow nt;
    nt.method();
    printf("NoThrow ctor noexcept: %d\n", noexcept(NoThrow()));

    MayThrow mt;
    mt.risky();

    printf("done\n");
    return 0;
}
