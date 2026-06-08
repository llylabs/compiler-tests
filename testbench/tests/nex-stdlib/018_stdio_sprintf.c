// Test: stdio.h — sprintf, snprintf
// @expect-exit: 0
// @expect-contains: sprintf: hello 42 3.14
// @expect-contains: snprintf(10): hello 42
// @expect-contains: snprintf ret=13
// @expect-contains: hex: 0xff
// @expect-contains: octal: 0377
// @expect-contains: pad: [  42]
// @expect-contains: left: [42  ]
// @expect-contains: zero: [0042]
#include <stdio.h>

int main() {
    char buf[256];

    sprintf(buf, "hello %d %.2f", 42, 3.14);
    printf("sprintf: %s\n", buf);

    int ret = snprintf(buf, 10, "hello %d %.2f", 42, 3.14);
    printf("snprintf(10): %s\n", buf);
    printf("snprintf ret=%d\n", ret);

    sprintf(buf, "0x%x", 255);
    printf("hex: %s\n", buf);

    sprintf(buf, "0%o", 255);
    printf("octal: %s\n", buf);

    sprintf(buf, "[%4d]", 42);
    printf("pad: %s\n", buf);

    sprintf(buf, "[%-4d]", 42);
    printf("left: %s\n", buf);

    sprintf(buf, "[%04d]", 42);
    printf("zero: %s\n", buf);

    return 0;
}
