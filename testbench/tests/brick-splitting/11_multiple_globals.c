// Test: Multiple global variables with different access patterns
// @expect-exit: 0
// @expect-contains: x=10 y=20 z=30
#include <stdio.h>
int gx = 0, gy = 0, gz = 0;
void set_x(int v) { gx = v; }
void set_y(int v) { gy = v; }
void set_z(int v) { gz = v; }
int get_x() { return gx; }
int get_y() { return gy; }
int get_z() { return gz; }
int main() {
    set_x(10);
    set_y(20);
    set_z(30);
    printf("x=%d y=%d z=%d\n", get_x(), get_y(), get_z());
    return 0;
}
