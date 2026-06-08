// Test: sys/stat.h, unistd.h — stat, mkdir, rmdir, getcwd
// @expect-exit: 0
// @expect-contains: mkdir ok
// @expect-contains: stat ok
// @expect-contains: rmdir ok
// @expect-contains: getcwd ok
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

int main() {
    const char *dir = "/tmp/nex_test_dir_stdlib";

    // mkdir
    rmdir(dir);  // cleanup from previous run
    if (mkdir(dir, 0755) == 0) printf("mkdir ok\n");
    else printf("mkdir FAIL\n");

    // stat
    struct stat st;
    if (stat(dir, &st) == 0) printf("stat ok\n");
    else printf("stat FAIL\n");

    // rmdir
    if (rmdir(dir) == 0) printf("rmdir ok\n");
    else printf("rmdir FAIL\n");

    // getcwd
    char cwd[256];
    if (getcwd(cwd, sizeof(cwd))) printf("getcwd ok\n");
    else printf("getcwd FAIL\n");

    return 0;
}
