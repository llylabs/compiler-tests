// Test: C++ — try/catch/throw, exception types
// @expect-exit: 0
// @expect-contains: caught int: 42
// @expect-contains: caught const char*: error
// @expect-contains: caught exception: std error
// @expect-contains: finally reached
#include <cstdio>
#include <exception>

class MyError : public std::exception {
    const char* msg_;
public:
    MyError(const char* m) : msg_(m) {}
    const char* what() const noexcept override { return msg_; }
};

int main() {
    // catch int
    try {
        throw 42;
    } catch (int e) {
        printf("caught int: %d\n", e);
    }

    // catch string
    try {
        throw "error";
    } catch (const char* e) {
        printf("caught const char*: %s\n", e);
    }

    // catch std::exception subclass
    try {
        throw MyError("std error");
    } catch (const std::exception& e) {
        printf("caught exception: %s\n", e.what());
    }

    printf("finally reached\n");
    return 0;
}
