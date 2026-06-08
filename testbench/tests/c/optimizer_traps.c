#include <stdio.h>
#include <string.h>

// Volatile: optimizer must not remove reads/writes
volatile int vol_counter = 0;

void increment_volatile() {
    for (int i = 0; i < 5; i++) {
        vol_counter++;
    }
}

// Dead code elimination trap — side effect in "dead" branch
int side_effect_counter = 0;
int has_side_effect(int x) {
    side_effect_counter++;
    return x;
}

// Constant folding edge cases
int test_constant_folding() {
    int a = 0x7FFFFFFF; // INT_MAX
    int b = 1;
    // This overflows - compiler must not fold incorrectly
    unsigned int c = (unsigned int)a + (unsigned int)b;
    return c == 0x80000000u;
}

// Loop-invariant code motion trap
int loop_invariant_trap(int n) {
    int result = 0;
    int arr[10] = {0,1,2,3,4,5,6,7,8,9};
    for (int i = 0; i < n; i++) {
        // arr[0] is loop-invariant but assigned IN the loop
        result += arr[0];
        arr[0] = i;
    }
    return result;
}

// Aliasing trap - two pointers to same location
void alias_trap(int *a, int *b) {
    *a = 1;
    *b = 2;
    // If optimizer assumes no aliasing, it might reorder or cache *a=1
    printf("alias: a=%d b=%d\n", *a, *b);
}

// Division edge cases
void division_edges() {
    // INT_MIN / -1 is UB on most platforms but should not crash
    int a = -2147483647; // Near INT_MIN but safe
    int b = -1;
    printf("div safe: %d\n", a / b);

    // Modulo with negatives
    printf("mod: %d %d %d\n", 7 % 3, -7 % 3, 7 % -3);

    // Zero division guard
    int c = 5;
    int d = c > 0 ? 100 / c : 0;
    printf("guarded div: %d\n", d);
}

// Sequence point: function call arguments
int order_a, order_b;
int side_a() { order_a = 1; return 10; }
int side_b() { order_b = 1; return 20; }
int use_both(int a, int b) { return a + b; }

// Strength reduction verification
int strength_test(int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum += i * 4; // optimizer might convert to i << 2 or repeated addition
    }
    return sum;
}

// Tail call candidate
int tail_sum(int n, int acc) {
    if (n <= 0) return acc;
    return tail_sum(n - 1, acc + n);
}

int main() {
    // Volatile
    increment_volatile();
    printf("volatile: %d\n", vol_counter);

    // Side effects preserved
    int x = 1;
    int y = x > 0 ? has_side_effect(10) : has_side_effect(20);
    printf("side effect: val=%d count=%d\n", y, side_effect_counter);

    // Constant folding
    printf("const fold: %d\n", test_constant_folding());

    // Loop invariant
    printf("loop inv: %d\n", loop_invariant_trap(5));

    // Aliasing
    int val = 0;
    alias_trap(&val, &val); // Same pointer!

    // Division
    division_edges();

    // Argument evaluation (both must execute)
    order_a = 0; order_b = 0;
    int sum = use_both(side_a(), side_b());
    printf("both called: sum=%d a=%d b=%d\n", sum, order_a, order_b);

    // Strength reduction
    printf("strength: %d\n", strength_test(10));

    // Tail call
    printf("tail: %d\n", tail_sum(100, 0));

    return 0;
}
