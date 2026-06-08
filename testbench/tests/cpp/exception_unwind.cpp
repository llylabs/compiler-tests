#include <stdio.h>

struct Guard {
    const char *name;
    Guard(const char *n) : name(n) { printf("guard %s created\n", name); }
    ~Guard() { printf("guard %s destroyed\n", name); }
};

void level3() {
    Guard g("L3");
    printf("throwing from level3\n");
    throw 42;
}

void level2() {
    Guard g("L2");
    level3();
    printf("should not print\n");
}

void level1() {
    Guard g("L1");
    level2();
    printf("should not print\n");
}

void test_rethrow() {
    try {
        try {
            throw "original";
        } catch (const char *msg) {
            printf("inner catch: %s\n", msg);
            throw; // rethrow
        }
    } catch (const char *msg) {
        printf("outer catch: %s\n", msg);
    }
}

int main() {
    // Unwinding through 3 stack frames with RAII
    printf("--- unwind test ---\n");
    try {
        level1();
    } catch (int val) {
        printf("caught at main: %d\n", val);
    }

    // Rethrow
    printf("--- rethrow test ---\n");
    test_rethrow();

    printf("done\n");
    return 0;
}
