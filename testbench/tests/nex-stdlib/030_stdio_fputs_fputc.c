// Test: stdio.h — fputs, fputc, puts to stdout/stderr
// @expect-exit: 0
// @expect-contains: fputs: hello
// @expect-contains: fputc: A
// @expect-contains: puts: world
#include <stdio.h>

int main() {
    fputs("fputs: hello\n", stdout);
    fputs("fputc: ", stdout);
    fputc('A', stdout);
    fputc('\n', stdout);
    puts("puts: world");
    return 0;
}
