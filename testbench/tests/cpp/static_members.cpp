#include <stdio.h>

struct Counter {
    static int count;
    int id;

    Counter() : id(++count) { printf("Counter %d (total=%d)\n", id, count); }
    ~Counter() { printf("~Counter %d\n", id); count--; }

    static int get_count() { return count; }
    static void reset() { count = 0; }
};

int Counter::count = 0;

struct MathUtils {
    static int factorial(int n) {
        return n <= 1 ? 1 : n * factorial(n - 1);
    }

    static int gcd(int a, int b) {
        while (b) { int t = b; b = a % b; a = t; }
        return a;
    }

    static const int PI_APPROX = 3;
};

int main() {
    printf("initial count: %d\n", Counter::get_count());

    {
        Counter a;
        Counter b;
        Counter c;
        printf("inside scope: %d\n", Counter::get_count());
    }
    printf("after scope: %d\n", Counter::get_count());

    // Static methods
    printf("5! = %d\n", MathUtils::factorial(5));
    printf("gcd(12,8) = %d\n", MathUtils::gcd(12, 8));
    printf("PI_APPROX = %d\n", MathUtils::PI_APPROX);

    return 0;
}
