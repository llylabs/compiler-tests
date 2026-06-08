#include <stdio.h>
#include <string.h>

int main() {
    char buf[64];
    strcpy(buf, "Hello");
    strcat(buf, ", ");
    strcat(buf, "World");
    printf("%s (len=%d)\n", buf, (int)strlen(buf));
    return 0;
}
