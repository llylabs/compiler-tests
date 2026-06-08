// Test: stdarg.h — variadic functions with va_start/va_arg/va_end
// @expect-exit: 0
// @expect-contains: sum(3)=6
// @expect-contains: sum(5)=15
// @expect-contains: max(4)=99
#include <stdio.h>
#include <stdarg.h>

int sum(int count, ...) {
    va_list ap;
    va_start(ap, count);
    int total = 0;
    for (int i = 0; i < count; i++) {
        total += va_arg(ap, int);
    }
    va_end(ap);
    return total;
}

int max(int count, ...) {
    va_list ap;
    va_start(ap, count);
    int m = va_arg(ap, int);
    for (int i = 1; i < count; i++) {
        int v = va_arg(ap, int);
        if (v > m) m = v;
    }
    va_end(ap);
    return m;
}

int main() {
    printf("sum(3)=%d\n", sum(3, 1, 2, 3));
    printf("sum(5)=%d\n", sum(5, 1, 2, 3, 4, 5));
    printf("max(4)=%d\n", max(4, 10, 99, 3, 42));
    return 0;
}
