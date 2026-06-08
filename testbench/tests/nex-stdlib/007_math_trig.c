// Test: math.h — trigonometric functions
// @expect-exit: 0
// @expect-contains: sin(0)=0.000
// @expect-contains: sin(pi/2)=1.000
// @expect-contains: cos(0)=1.000
// @expect-contains: cos(pi)=-1.000
// @expect-contains: tan(0)=0.000
// @expect-contains: asin(1)=1.571
// @expect-contains: acos(0)=1.571
// @expect-contains: atan(1)=0.785
// @expect-contains: atan2(1,1)=0.785
#include <stdio.h>
#include <math.h>

int main() {
    double pi = 3.14159265358979323846;
    printf("sin(0)=%.3f\n", sin(0.0));
    printf("sin(pi/2)=%.3f\n", sin(pi / 2.0));
    printf("cos(0)=%.3f\n", cos(0.0));
    printf("cos(pi)=%.3f\n", cos(pi));
    printf("tan(0)=%.3f\n", tan(0.0));
    printf("asin(1)=%.3f\n", asin(1.0));
    printf("acos(0)=%.3f\n", acos(0.0));
    printf("atan(1)=%.3f\n", atan(1.0));
    printf("atan2(1,1)=%.3f\n", atan2(1.0, 1.0));
    return 0;
}
