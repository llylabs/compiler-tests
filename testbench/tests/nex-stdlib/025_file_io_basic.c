// Test: unistd.h/fcntl.h — open, write, lseek, read, close, unlink
// @expect-exit: 0
// @expect-contains: write ok: 13
// @expect-contains: read ok: hello, world!
// @expect-contains: lseek ok: hello
// @expect-contains: unlink ok
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>

int main() {
    const char *path = "/tmp/nex_test_file_io.txt";
    const char *msg = "hello, world!";

    // Write
    int fd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) { printf("open write FAIL\n"); return 1; }
    int n = write(fd, msg, strlen(msg));
    printf("write ok: %d\n", n);
    close(fd);

    // Read back
    fd = open(path, O_RDONLY, 0);
    if (fd < 0) { printf("open read FAIL\n"); return 1; }
    char buf[64];
    memset(buf, 0, sizeof(buf));
    n = read(fd, buf, sizeof(buf) - 1);
    printf("read ok: %s\n", buf);

    // Seek to beginning, read partial
    lseek(fd, 0, 0);  // SEEK_SET
    memset(buf, 0, sizeof(buf));
    read(fd, buf, 5);
    printf("lseek ok: %s\n", buf);
    close(fd);

    // Cleanup
    if (unlink(path) == 0) printf("unlink ok\n");

    return 0;
}
