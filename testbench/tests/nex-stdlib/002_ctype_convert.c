// Test: ctype.h — toupper/tolower conversion
// @expect-exit: 0
// @expect-contains: toupper(a)=A
// @expect-contains: toupper(Z)=Z
// @expect-contains: toupper(5)=5
// @expect-contains: tolower(A)=a
// @expect-contains: tolower(z)=z
// @expect-contains: tolower(!)=!
// @expect-contains: HELLO WORLD
// @expect-contains: hello world
#include <stdio.h>
#include <ctype.h>

int main() {
    printf("toupper(a)=%c\n", toupper('a'));
    printf("toupper(Z)=%c\n", toupper('Z'));
    printf("toupper(5)=%c\n", toupper('5'));
    printf("tolower(A)=%c\n", tolower('A'));
    printf("tolower(z)=%c\n", tolower('z'));
    printf("tolower(!)=%c\n", tolower('!'));

    const char *s = "Hello World";
    char i;
    for (i = 0; s[(int)i]; i++) putchar(toupper(s[(int)i]));
    putchar('\n');
    for (i = 0; s[(int)i]; i++) putchar(tolower(s[(int)i]));
    putchar('\n');
    return 0;
}
