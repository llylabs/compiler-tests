#include <stdio.h>

struct Trivial {
    int x, y;
    Trivial() = default;
    ~Trivial() = default;
};

struct NonCopyable {
    int value;
    NonCopyable(int v) : value(v) { printf("ctor %d\n", value); }
    NonCopyable(const NonCopyable &) = delete;
    NonCopyable &operator=(const NonCopyable &) = delete;
    // Move is still allowed
    NonCopyable(NonCopyable &&other) : value(other.value) {
        other.value = -1;
        printf("move %d\n", value);
    }
    ~NonCopyable() { printf("dtor %d\n", value); }
};

struct ExplicitOnly {
    int val;
    explicit ExplicitOnly(int v) : val(v) {}
    // Prevent implicit conversion
};

void take_explicit(ExplicitOnly e) {
    printf("explicit: %d\n", e.val);
}

int main() {
    // Default constructor
    Trivial t;
    t.x = 1; t.y = 2;
    printf("trivial: %d %d\n", t.x, t.y);

    // NonCopyable - only moveable
    NonCopyable a(42);
    NonCopyable b(static_cast<NonCopyable&&>(a));
    printf("a=%d b=%d\n", a.value, b.value);

    // Explicit constructor
    ExplicitOnly e(10);
    take_explicit(ExplicitOnly(20));
    // take_explicit(30);  // Would fail to compile - no implicit conversion

    printf("done\n");
    return 0;
}
