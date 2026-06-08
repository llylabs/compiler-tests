#include <stdio.h>
#include <string.h>

int main() {
    // strtok
    char sentence[] = "hello world foo bar";
    char *tok = strtok(sentence, " ");
    printf("tokens:");
    while (tok) {
        printf(" %s", tok);
        tok = strtok(NULL, " ");
    }
    printf("\n");

    // strstr
    const char *haystack = "the quick brown fox";
    const char *found = strstr(haystack, "brown");
    printf("strstr: %s\n", found ? found : "not found");
    found = strstr(haystack, "red");
    printf("strstr miss: %s\n", found ? found : "not found");

    // strchr / strrchr
    const char *path = "/home/user/file.txt";
    const char *last_slash = strrchr(path, '/');
    printf("filename: %s\n", last_slash + 1);
    const char *first_slash = strchr(path, '/');
    printf("first slash at: %d\n", (int)(first_slash - path));

    // strncpy
    char dst[10];
    strncpy(dst, "hello", 10);
    printf("strncpy: %s\n", dst);

    // strncat
    char base[30] = "Hello";
    strncat(base, " Beautiful World", 10);
    printf("strncat: %s\n", base);

    // strncmp
    printf("strncmp eq: %d\n", strncmp("hello", "hello world", 5) == 0 ? 1 : 0);
    printf("strncmp ne: %d\n", strncmp("hello", "help", 4) == 0 ? 1 : 0);

    return 0;
}
