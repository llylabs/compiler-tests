// Test: math.h — hyperbolic functions
// @expect-exit: 0
// @expect-contains: sinh(0)=0.000
// @expect-contains: sinh(1)=1.175
// @expect-contains: cosh(0)=1.000
// @expect-contains: cosh(1)=1.543
// @expect-contains: tanh(0)=0.000
// @expect-contains: tanh(1)=0.762
#include <stdio.h>
#include <math.h>

int main() {
    printf("sinh(0)=%.3f\n", sinh(0.0));
    printf("sinh(1)=%.3f\n", sinh(1.0));
    printf("cosh(0)=%.3f\n", cosh(0.0));
    printf("cosh(1)=%.3f\n", cosh(1.0));
    printf("tanh(0)=%.3f\n", tanh(0.0));
    printf("tanh(1)=%.3f\n", tanh(1.0));
    return 0;
}
