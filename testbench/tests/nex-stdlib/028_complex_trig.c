// Test: complex.h — trigonometric and exponential complex functions
// @expect-exit: 0
// @expect-contains: csin ok
// @expect-contains: ccos ok
// @expect-contains: ctan ok
// @expect-contains: clog ok
// @expect-contains: cpow ok
#include <stdio.h>
#include <complex.h>
#include <math.h>

int main() {
    double complex z = 1.0 + 1.0 * I;

    // csin
    double complex s = csin(z);
    double sr = creal(s), si = cimag(s);
    printf("csin %s\n", (fabs(sr - 1.2985) < 0.001 && fabs(si - 0.6350) < 0.001) ? "ok" : "FAIL");

    // ccos
    double complex c = ccos(z);
    double cr = creal(c), ci = cimag(c);
    printf("ccos %s\n", (fabs(cr - 0.8337) < 0.001 && fabs(ci + 0.9889) < 0.001) ? "ok" : "FAIL");

    // ctan
    double complex t = ctan(z);
    printf("ctan %s\n", (fabs(creal(t) - 0.2718) < 0.001) ? "ok" : "FAIL");

    // clog
    double complex l = clog(z);
    printf("clog %s\n", (fabs(creal(l) - 0.3466) < 0.001 && fabs(cimag(l) - 0.7854) < 0.001) ? "ok" : "FAIL");

    // cpow(2+0i, 3+0i) = 8+0i
    double complex p = cpow(2.0 + 0.0 * I, 3.0 + 0.0 * I);
    printf("cpow %s\n", (fabs(creal(p) - 8.0) < 0.01) ? "ok" : "FAIL");

    return 0;
}
