#include <stdio.h>

int counter = 0;
const char *message = "global";

void increment(void) { counter++; }

int main() {
    increment();
    increment();
    increment();
    printf("%s: %d\n", message, counter);
    return 0;
}
