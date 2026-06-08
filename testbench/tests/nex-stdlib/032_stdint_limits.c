// Test: stdint.h, limits.h — integer types and limits
// @expect-exit: 0
// @expect-contains: int8_min=-128
// @expect-contains: int8_max=127
// @expect-contains: uint8_max=255
// @expect-contains: int16_min=-32768
// @expect-contains: int16_max=32767
// @expect-contains: uint16_max=65535
// @expect-contains: int32_min=-2147483648
// @expect-contains: int32_max=2147483647
// @expect-contains: uint32_max=4294967295
// @expect-contains: sizeof_ptr=4
#include <stdio.h>
#include <stdint.h>
#include <limits.h>

int main() {
    printf("int8_min=%d\n", INT8_MIN);
    printf("int8_max=%d\n", INT8_MAX);
    printf("uint8_max=%u\n", UINT8_MAX);
    printf("int16_min=%d\n", INT16_MIN);
    printf("int16_max=%d\n", INT16_MAX);
    printf("uint16_max=%u\n", UINT16_MAX);
    printf("int32_min=%d\n", INT32_MIN);
    printf("int32_max=%d\n", INT32_MAX);
    printf("uint32_max=%u\n", UINT32_MAX);
    printf("sizeof_ptr=%d\n", (int)sizeof(void*));
    return 0;
}
