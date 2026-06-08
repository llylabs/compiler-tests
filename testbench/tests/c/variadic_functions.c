#include <stdio.h>
#include <stdarg.h>

int sum(int count, ...) {
    va_list args;
    va_start(args, count);
    int total = 0;
    for (int i = 0; i < count; i++) {
        total += va_arg(args, int);
    }
    va_end(args);
    return total;
}

double average(int count, ...) {
    va_list args;
    va_start(args, count);
    double total = 0;
    for (int i = 0; i < count; i++) {
        total += va_arg(args, double);
    }
    va_end(args);
    return total / count;
}

void log_msg(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    printf("[LOG] ");
    vprintf(fmt, args);
    va_end(args);
}

int max_of(int count, ...) {
    va_list args;
    va_start(args, count);
    int m = va_arg(args, int);
    for (int i = 1; i < count; i++) {
        int v = va_arg(args, int);
        if (v > m) m = v;
    }
    va_end(args);
    return m;
}

int main() {
    printf("sum(3): %d\n", sum(3, 10, 20, 30));
    printf("sum(5): %d\n", sum(5, 1, 2, 3, 4, 5));
    printf("avg: %.1f\n", average(3, 10.0, 20.0, 30.0));
    printf("max: %d\n", max_of(4, 3, 7, 2, 9));
    log_msg("value=%d name=%s\n", 42, "test");

    return 0;
}
