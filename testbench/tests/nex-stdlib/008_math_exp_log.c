// Test: math.h — exponential and logarithmic functions
// @expect-exit: 0
// @expect-contains: exp(0)=1.000
// @expect-contains: exp(1)=2.718
// @expect-contains: log(1)=0.000
// @expect-contains: log(e)=1.000
// @expect-contains: log10(100)=2.000
// @expect-contains: log2(8)=3.000
// @expect-contains: pow(2,10)=1024.000
// @expect-contains: sqrt(144)=12.000
#include <stdio.h>
#include <math.h>

int main() {
    double e = 2.71828182845904523536;
    printf("exp(0)=%.3f\n", exp(0.0));
    printf("exp(1)=%.3f\n", exp(1.0));
    printf("log(1)=%.3f\n", log(1.0));
    printf("log(e)=%.3f\n", log(e));
    printf("log10(100)=%.3f\n", log10(100.0));
    printf("log2(8)=%.3f\n", log2(8.0));
    printf("pow(2,10)=%.3f\n", pow(2.0, 10.0));
    printf("sqrt(144)=%.3f\n", sqrt(144.0));
    return 0;
}
