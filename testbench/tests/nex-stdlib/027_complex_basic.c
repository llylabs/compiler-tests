// Test: complex.h — basic complex number operations
// @expect-exit: 0
// @expect-contains: cabs=5.000
// @expect-contains: carg=0.927
// @expect-contains: csqrt real=2.000
// @expect-contains: cexp real=-1.000
#include <stdio.h>
#include <complex.h>
#include <math.h>

int main() {
    double complex z = 3.0 + 4.0 * I;

    // cabs: |3+4i| = 5
    printf("cabs=%.3f\n", cabs(z));

    // carg: angle of 3+4i
    printf("carg=%.3f\n", carg(z));

    // csqrt
    double complex sq = csqrt(z);
    printf("csqrt real=%.3f\n", creal(sq));

    // cexp(i*pi) ≈ -1
    double complex eip = cexp(I * 3.14159265358979323846);
    printf("cexp real=%.3f\n", creal(eip));

    return 0;
}
