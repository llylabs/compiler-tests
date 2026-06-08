// Test: stdlib.h — atexit (LIFO order)
// @expect-exit: 0
// @expect-contains: main done
// @expect-contains: atexit: third
// @expect-contains: atexit: second
// @expect-contains: atexit: first
#include <stdio.h>
#include <stdlib.h>

void handler1(void) { printf("atexit: first\n"); }
void handler2(void) { printf("atexit: second\n"); }
void handler3(void) { printf("atexit: third\n"); }

int main() {
    atexit(handler1);
    atexit(handler2);
    atexit(handler3);
    printf("main done\n");
    return 0;
}
