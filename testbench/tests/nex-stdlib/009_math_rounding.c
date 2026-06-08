// Test: math.h — rounding, absolute, modulo functions
// @expect-exit: 0
// @expect-contains: ceil(2.3)=3.000
// @expect-contains: ceil(-2.3)=-2.000
// @expect-contains: floor(2.7)=2.000
// @expect-contains: floor(-2.7)=-3.000
// @expect-contains: round(2.5)=3.000
// @expect-contains: round(-2.5)=-3.000
// @expect-contains: trunc(2.9)=2.000
// @expect-contains: trunc(-2.9)=-2.000
// @expect-contains: fabs(-42.5)=42.500
// @expect-contains: fmod(10.5,3.0)=1.500
#include <stdio.h>
#include <math.h>

int main() {
    printf("ceil(2.3)=%.3f\n", ceil(2.3));
    printf("ceil(-2.3)=%.3f\n", ceil(-2.3));
    printf("floor(2.7)=%.3f\n", floor(2.7));
    printf("floor(-2.7)=%.3f\n", floor(-2.7));
    printf("round(2.5)=%.3f\n", round(2.5));
    printf("round(-2.5)=%.3f\n", round(-2.5));
    printf("trunc(2.9)=%.3f\n", trunc(2.9));
    printf("trunc(-2.9)=%.3f\n", trunc(-2.9));
    printf("fabs(-42.5)=%.3f\n", fabs(-42.5));
    printf("fmod(10.5,3.0)=%.3f\n", fmod(10.5, 3.0));
    return 0;
}
