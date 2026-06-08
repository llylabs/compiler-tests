#include <stdio.h>

int main() {
    // Integer formats
    printf("dec: %d\n", 255);
    printf("hex: %x\n", 255);
    printf("HEX: %X\n", 255);
    printf("oct: %o\n", 255);

    // Padding and width
    printf("[%10d]\n", 42);
    printf("[%-10d]\n", 42);
    printf("[%05d]\n", 42);

    // Float formats
    printf("float: %.3f\n", 3.14159);
    printf("sci: %.2e\n", 12345.678);

    // Strings
    printf("[%10s]\n", "hi");
    printf("[%-10s]\n", "hi");
    printf("[%.3s]\n", "hello");

    // Chars
    printf("char: %c\n", 65);

    // Percent literal
    printf("100%%\n");

    // Negative numbers
    printf("neg: %d\n", -42);

    // Zero
    printf("zero: %d\n", 0);

    // Multiple args
    printf("%d + %d = %d\n", 3, 4, 7);

    // Long
    printf("long: %ld\n", 1000000L);

    // Unsigned
    printf("unsigned: %u\n", 4294967295u);

    return 0;
}
