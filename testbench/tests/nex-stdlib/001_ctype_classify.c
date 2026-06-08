// Test: ctype.h — character classification functions
// @expect-exit: 0
// @expect-contains: isalpha(A)=1
// @expect-contains: isalpha(5)=0
// @expect-contains: isdigit(7)=1
// @expect-contains: isdigit(x)=0
// @expect-contains: isalnum(B)=1
// @expect-contains: isalnum(3)=1
// @expect-contains: isalnum(!)=0
// @expect-contains: isspace( )=1
// @expect-contains: isspace(a)=0
// @expect-contains: isupper(Z)=1
// @expect-contains: isupper(z)=0
// @expect-contains: islower(a)=1
// @expect-contains: islower(A)=0
// @expect-contains: isprint(G)=1
// @expect-contains: iscntrl(\n)=1
// @expect-contains: ispunct(!)=1
// @expect-contains: isxdigit(f)=1
// @expect-contains: isxdigit(g)=0
// @expect-contains: isblank( )=1
// @expect-contains: isblank(\t)=1
// @expect-contains: isgraph(!)=1
// @expect-contains: isgraph( )=0
#include <stdio.h>
#include <ctype.h>

int main() {
    printf("isalpha(A)=%d\n", isalpha('A') ? 1 : 0);
    printf("isalpha(5)=%d\n", isalpha('5') ? 1 : 0);
    printf("isdigit(7)=%d\n", isdigit('7') ? 1 : 0);
    printf("isdigit(x)=%d\n", isdigit('x') ? 1 : 0);
    printf("isalnum(B)=%d\n", isalnum('B') ? 1 : 0);
    printf("isalnum(3)=%d\n", isalnum('3') ? 1 : 0);
    printf("isalnum(!)=%d\n", isalnum('!') ? 1 : 0);
    printf("isspace( )=%d\n", isspace(' ') ? 1 : 0);
    printf("isspace(a)=%d\n", isspace('a') ? 1 : 0);
    printf("isupper(Z)=%d\n", isupper('Z') ? 1 : 0);
    printf("isupper(z)=%d\n", isupper('z') ? 1 : 0);
    printf("islower(a)=%d\n", islower('a') ? 1 : 0);
    printf("islower(A)=%d\n", islower('A') ? 1 : 0);
    printf("isprint(G)=%d\n", isprint('G') ? 1 : 0);
    printf("iscntrl(\\n)=%d\n", iscntrl('\n') ? 1 : 0);
    printf("ispunct(!)=%d\n", ispunct('!') ? 1 : 0);
    printf("isxdigit(f)=%d\n", isxdigit('f') ? 1 : 0);
    printf("isxdigit(g)=%d\n", isxdigit('g') ? 1 : 0);
    printf("isblank( )=%d\n", isblank(' ') ? 1 : 0);
    printf("isblank(\\t)=%d\n", isblank('\t') ? 1 : 0);
    printf("isgraph(!)=%d\n", isgraph('!') ? 1 : 0);
    printf("isgraph( )=%d\n", isgraph(' ') ? 1 : 0);
    return 0;
}
