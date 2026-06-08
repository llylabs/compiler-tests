// Test: math.h — edge cases (NaN, Infinity, -0)
// @expect-exit: 0
// @expect-contains: sqrt(-1) is NaN
// @expect-contains: log(0) is -Inf
// @expect-contains: exp(1000) is +Inf
// @expect-contains: pow(0,0)=1.000
// @expect-contains: fabs(-0.0)=0.000
// @expect-contains: ceil(-0.0)=-0.000
#include <stdio.h>
#include <math.h>

int main() {
    double nan_val = sqrt(-1.0);
    double neg_inf = log(0.0);
    double pos_inf = exp(1000.0);

    if (nan_val != nan_val) printf("sqrt(-1) is NaN\n");
    if (neg_inf < -1e300) printf("log(0) is -Inf\n");
    if (pos_inf > 1e300) printf("exp(1000) is +Inf\n");

    printf("pow(0,0)=%.3f\n", pow(0.0, 0.0));
    printf("fabs(-0.0)=%.3f\n", fabs(-0.0));
    printf("ceil(-0.0)=%.3f\n", ceil(-0.0));
    return 0;
}
