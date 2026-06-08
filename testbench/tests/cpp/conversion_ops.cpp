#include <stdio.h>

struct Boolean {
    bool val;
    Boolean(bool v) : val(v) {}
    explicit operator bool() const { return val; }
};

struct Numeric {
    double value;
    Numeric(double v) : value(v) {}
    operator int() const { return (int)value; }
    operator double() const { return value; }
};

struct StringWrapper {
    char buf[32];
    int len;
    StringWrapper(const char *s) {
        len = 0;
        while (s[len] && len < 31) { buf[len] = s[len]; len++; }
        buf[len] = '\0';
    }
    operator const char *() const { return buf; }
    operator int() const { return len; }
};

struct Mutable {
    mutable int access_count;
    int value;
    Mutable(int v) : access_count(0), value(v) {}
    int get() const { access_count++; return value; }
};

int main() {
    // Explicit bool conversion
    Boolean bt(true), bf(false);
    if (bt) printf("bool true: yes\n");
    if (!bf) printf("bool false: no\n");

    // Implicit numeric conversion
    Numeric n(3.7);
    int i = n;
    double d = n;
    printf("to int: %d\n", i);
    printf("to double: %.1f\n", d);

    // String wrapper conversions
    StringWrapper sw("hello");
    const char *s = sw;
    int len = sw;
    printf("string: %s len=%d\n", s, len);

    // Mutable in const method
    const Mutable m(42);
    printf("value: %d (accesses: %d)\n", m.get(), m.access_count);
    printf("value: %d (accesses: %d)\n", m.get(), m.access_count);

    return 0;
}
