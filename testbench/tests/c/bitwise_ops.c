#include <stdio.h>

unsigned int set_bit(unsigned int x, int pos) { return x | (1u << pos); }
unsigned int clear_bit(unsigned int x, int pos) { return x & ~(1u << pos); }
int test_bit(unsigned int x, int pos) { return (x >> pos) & 1; }

int count_bits(unsigned int x) {
    int count = 0;
    while (x) { count += x & 1; x >>= 1; }
    return count;
}

unsigned int rotate_left(unsigned int x, int n) {
    return (x << n) | (x >> (32 - n));
}

int main() {
    // Basic operations
    unsigned int a = 0xF0, b = 0x0F;
    printf("AND: 0x%02X\n", a & b);
    printf("OR:  0x%02X\n", a | b);
    printf("XOR: 0x%02X\n", a ^ b);
    printf("NOT: 0x%02X\n", (unsigned char)~a);

    // Shifts
    printf("shl: %u\n", 1u << 10);
    printf("shr: %u\n", 1024u >> 5);

    // Bit manipulation
    unsigned int x = 0;
    x = set_bit(x, 0);
    x = set_bit(x, 3);
    x = set_bit(x, 7);
    printf("set bits: %u\n", x);
    printf("bit 3: %d\n", test_bit(x, 3));
    printf("bit 4: %d\n", test_bit(x, 4));
    x = clear_bit(x, 3);
    printf("cleared 3: %u\n", x);

    // Popcount
    printf("bits in 0xFF: %d\n", count_bits(0xFF));
    printf("bits in 0x55: %d\n", count_bits(0x55));

    // Sign extension / integer promotion
    signed char sc = -1;
    int promoted = sc;
    printf("sign extend: %d\n", promoted);

    unsigned char uc = 200;
    int upromoted = uc;
    printf("zero extend: %d\n", upromoted);

    return 0;
}
