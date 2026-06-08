// Test: stdio.h — printf format specifiers edge cases
// @expect-exit: 0
// @expect-contains: char: A
// @expect-contains: string: hello
// @expect-contains: trunc: hel
// @expect-contains: int: -42
// @expect-contains: uint: 4294967295
// @expect-contains: hex: ff
// @expect-contains: HEX: FF
// @expect-contains: oct: 77
// @expect-contains: float: 3.141593
// @expect-contains: sci: 1.230000e+02
// @expect-contains: SCI: 1.230000E+02
// @expect-contains: pct: 100%
#include <stdio.h>

int main() {
    printf("char: %c\n", 'A');
    printf("string: %s\n", "hello");
    printf("trunc: %.3s\n", "hello");
    printf("int: %d\n", -42);
    printf("uint: %u\n", (unsigned int)4294967295U);
    printf("hex: %x\n", 255);
    printf("HEX: %X\n", 255);
    printf("oct: %o\n", 63);
    printf("float: %f\n", 3.141593);
    printf("sci: %e\n", 123.0);
    printf("SCI: %E\n", 123.0);
    printf("pct: 100%%\n");
    return 0;
}
