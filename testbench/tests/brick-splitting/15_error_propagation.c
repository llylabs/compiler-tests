// Test: Error code propagation through call chain
// @expect-exit: 0
// @expect-contains: result=42
#include <stdio.h>
int validate(int x) { return x > 0 ? 0 : -1; }
int transform(int x) {
    if (validate(x) != 0) return -1;
    return x * 2;
}
int process(int x) {
    int t = transform(x);
    if (t < 0) return -1;
    return t + 21;
}
int main() {
    int r = process(21);
    if (r < 0) { printf("error\n"); return 1; }
    printf("result=%d\n", r - 21);
    return 0;
}
