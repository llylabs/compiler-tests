// Test: string.h — strcmp, strncmp, strcpy, strcat with edge cases
// @expect-exit: 0
// @expect-contains: strcmp equal: 0
// @expect-contains: strcmp less: -1
// @expect-contains: strcmp greater: 1
// @expect-contains: strncmp partial: 0
// @expect-contains: strcpy: hello
// @expect-contains: strcat: hello world
// @expect-contains: strlen empty: 0
// @expect-contains: strcmp empty: -1
#include <stdio.h>
#include <string.h>

int main() {
    printf("strcmp equal: %d\n", strcmp("abc", "abc"));
    printf("strcmp less: %d\n", strcmp("abc", "abd") < 0 ? -1 : 1);
    printf("strcmp greater: %d\n", strcmp("abd", "abc") > 0 ? 1 : -1);
    printf("strncmp partial: %d\n", strncmp("abcdef", "abcxyz", 3));

    char buf[64];
    strcpy(buf, "hello");
    printf("strcpy: %s\n", buf);
    strcat(buf, " world");
    printf("strcat: %s\n", buf);

    printf("strlen empty: %d\n", (int)strlen(""));
    printf("strcmp empty: %d\n", strcmp("", "a") < 0 ? -1 : 1);

    return 0;
}
