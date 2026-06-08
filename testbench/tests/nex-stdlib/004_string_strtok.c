// Test: string.h — strtok tokenization
// @expect-exit: 0
// @expect-contains: token[0]=hello
// @expect-contains: token[1]=world
// @expect-contains: token[2]=foo
// @expect-contains: token[3]=bar
// @expect-contains: count=4
#include <stdio.h>
#include <string.h>

int main() {
    char s[] = "hello,world;foo:bar";
    int count = 0;
    char *tok = strtok(s, ",;:");
    while (tok) {
        printf("token[%d]=%s\n", count, tok);
        count++;
        tok = strtok(NULL, ",;:");
    }
    printf("count=%d\n", count);
    return 0;
}
