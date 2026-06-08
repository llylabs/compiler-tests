#include <stdio.h>

int main() {
    // Catch nullptr as void*
    try {
        throw (void *)0;
    } catch (void *p) {
        printf("caught void*: %s\n", p == 0 ? "null" : "not null");
    }

    // Catch int pointer null
    try {
        int *p = 0;
        throw p;
    } catch (int *p) {
        printf("caught int*: %s\n", p == 0 ? "null" : "not null");
    }

    // Multiple types - ensure correct matching
    try {
        throw (void *)0;
    } catch (int val) {
        printf("should not catch as int\n");
    } catch (void *p) {
        printf("correct: caught as void*\n");
    }

    printf("done\n");
    return 0;
}
