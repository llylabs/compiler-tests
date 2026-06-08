#include <stdio.h>

struct MyException {
    int code;
    const char *msg;
    MyException(int c, const char *m) : code(c), msg(m) {}
};

int divide(int a, int b) {
    if (b == 0) throw MyException(1, "division by zero");
    return a / b;
}

int main() {
    // Basic try/catch
    try {
        printf("10/2 = %d\n", divide(10, 2));
        printf("10/0 = ");
        printf("%d\n", divide(10, 0));
    } catch (MyException &e) {
        printf("caught: code=%d msg=%s\n", e.code, e.msg);
    }

    // Catch int
    try {
        throw 42;
    } catch (int val) {
        printf("caught int: %d\n", val);
    }

    // Catch const char*
    try {
        throw "error message";
    } catch (const char *msg) {
        printf("caught str: %s\n", msg);
    }

    // Multiple catch blocks
    for (int i = 0; i < 3; i++) {
        try {
            if (i == 0) throw 100;
            if (i == 1) throw "hello";
            if (i == 2) throw MyException(3, "custom");
        } catch (int v) {
            printf("int: %d\n", v);
        } catch (const char *s) {
            printf("str: %s\n", s);
        } catch (MyException &e) {
            printf("exc: %d\n", e.code);
        }
    }

    // No exception path
    try {
        int x = 5 + 3;
        printf("no throw: %d\n", x);
    } catch (...) {
        printf("should not reach\n");
    }

    printf("done\n");
    return 0;
}
