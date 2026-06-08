#include <stdio.h>

int counter(void) {
    static int count = 0;
    return ++count;
}

int accumulate(int val) {
    static int total = 0;
    total += val;
    return total;
}

const char *toggle(void) {
    static int state = 0;
    state = !state;
    return state ? "on" : "off";
}

int fibonacci_cached(int n) {
    static int cache[20] = {0};
    static int initialized = 0;
    if (!initialized) {
        cache[0] = 0;
        cache[1] = 1;
        for (int i = 2; i < 20; i++) cache[i] = cache[i-1] + cache[i-2];
        initialized = 1;
    }
    return cache[n];
}

int main() {
    // Counter persistence
    for (int i = 0; i < 5; i++) {
        printf("count: %d\n", counter());
    }

    // Accumulator
    printf("acc: %d\n", accumulate(10));
    printf("acc: %d\n", accumulate(20));
    printf("acc: %d\n", accumulate(30));

    // Toggle
    for (int i = 0; i < 4; i++) {
        printf("toggle: %s\n", toggle());
    }

    // Cached computation
    printf("fib(0)=%d fib(5)=%d fib(10)=%d fib(15)=%d\n",
           fibonacci_cached(0), fibonacci_cached(5),
           fibonacci_cached(10), fibonacci_cached(15));

    return 0;
}
