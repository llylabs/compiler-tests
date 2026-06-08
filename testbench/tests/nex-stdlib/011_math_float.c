// Test: math.h — float (f32) variants
// @expect-exit: 0
// @expect-contains: sinf=0.841
// @expect-contains: cosf=0.540
// @expect-contains: sqrtf=3.000
// @expect-contains: powf=8.000
// @expect-contains: fabsf=3.140
#include <stdio.h>
#include <math.h>

int main() {
    printf("sinf=%.3f\n", sinf(1.0f));
    printf("cosf=%.3f\n", cosf(1.0f));
    printf("sqrtf=%.3f\n", sqrtf(9.0f));
    printf("powf=%.3f\n", powf(2.0f, 3.0f));
    printf("fabsf=%.3f\n", fabsf(-3.14f));
    return 0;
}
