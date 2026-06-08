#include <stdio.h>
#include <string.h>

int main() {
    char buf[100];

    // sprintf basic
    sprintf(buf, "Hello %s, you are %d", "World", 42);
    printf("sprintf: %s\n", buf);

    // sprintf with float
    sprintf(buf, "pi=%.4f", 3.14159);
    printf("sprintf float: %s\n", buf);

    // snprintf truncation
    char small[10];
    int written = snprintf(small, 10, "This is a very long string");
    printf("snprintf: %s\n", small);
    printf("would need: %d\n", written);

    // snprintf exact fit
    char exact[6];
    snprintf(exact, 6, "Hello");
    printf("exact: %s\n", exact);

    // Building a string incrementally
    char result[100];
    int pos = 0;
    for (int i = 1; i <= 5; i++) {
        pos += sprintf(result + pos, "%d", i);
        if (i < 5) pos += sprintf(result + pos, ",");
    }
    printf("built: %s\n", result);

    return 0;
}
