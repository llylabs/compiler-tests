#include <stdio.h>

struct BaseError {
    int code;
    virtual const char *what() const { return "BaseError"; }
    BaseError(int c) : code(c) {}
    virtual ~BaseError() {}
};

struct DerivedError : BaseError {
    const char *detail;
    const char *what() const { return detail; }
    DerivedError(int c, const char *d) : BaseError(c), detail(d) {}
};

struct DeepError : DerivedError {
    DeepError() : DerivedError(3, "DeepError") {}
};

void throw_derived() {
    throw DerivedError(42, "something failed");
}

void throw_deep() {
    throw DeepError();
}

int main() {
    // Catch derived as base
    try {
        throw_derived();
    } catch (BaseError &e) {
        printf("caught as Base: code=%d what=%s\n", e.code, e.what());
    }

    // Catch deep as base
    try {
        throw_deep();
    } catch (BaseError &e) {
        printf("caught deep as Base: code=%d what=%s\n", e.code, e.what());
    }

    // Catch derived as derived (exact match)
    try {
        throw_derived();
    } catch (DerivedError &e) {
        printf("caught as Derived: %s\n", e.what());
    }

    // Multiple catch blocks - first matching wins
    try {
        throw DeepError();
    } catch (DeepError &e) {
        printf("exact: %s\n", e.what());
    } catch (BaseError &e) {
        printf("should not reach\n");
    }

    // Base catches when exact doesn't match
    try {
        throw DerivedError(7, "derived only");
    } catch (DeepError &e) {
        printf("should not reach\n");
    } catch (BaseError &e) {
        printf("fallback base: code=%d\n", e.code);
    }

    printf("done\n");
    return 0;
}
