#include <stdio.h>

// Volatile member
struct Sensor {
    volatile int reading;
    Sensor() : reading(0) {}
    void update(int v) { reading = v; }
    int read() const { return reading; }
};

// Return value optimization test — verify no extra copies
static int copy_count = 0;
struct Heavy {
    int data[4];
    Heavy() { data[0] = 0; }
    Heavy(int v) { data[0] = v; }
    Heavy(const Heavy &o) {
        copy_count++;
        for (int i = 0; i < 4; i++) data[i] = o.data[i];
    }
};

Heavy make_heavy(int v) {
    Heavy h(v);
    return h; // NRVO candidate
}

// Side effects in short-circuit evaluation
int eval_count = 0;
bool side_true() { eval_count++; return true; }
bool side_false() { eval_count++; return false; }

// Const propagation with references
void const_prop_test() {
    const int x = 42;
    const int *p = &x;
    printf("const prop: %d\n", *p);

    // Array of const
    const int arr[] = {1, 2, 3};
    int sum = 0;
    for (int i = 0; i < 3; i++) sum += arr[i];
    printf("const arr sum: %d\n", sum);
}

// Empty base optimization
struct Empty {};
struct WithEmpty : Empty { int value; };

// Inline namespace-like: nested anonymous namespace
namespace {
    int hidden_global = 42;
    int hidden_func() { return hidden_global; }
}

// Dead store elimination test
void dead_store_test() {
    int x = 1; // Dead store?
    x = 2;     // Dead store?
    x = 3;     // Dead store?
    printf("dead store: %d\n", x); // Only this matters, but all stores must be legal
}

// Loop unrolling candidate
int unroll_sum() {
    int sum = 0;
    for (int i = 0; i < 8; i++) {
        sum += i * i;
    }
    return sum;
}

int main() {
    // Volatile
    Sensor s;
    s.update(10);
    s.update(20);
    s.update(30);
    printf("sensor: %d\n", s.read());

    // RVO/NRVO
    copy_count = 0;
    Heavy h = make_heavy(42);
    printf("heavy val: %d copies: %d\n", h.data[0], copy_count);

    // Short-circuit
    eval_count = 0;
    bool r1 = side_false() && side_true(); // second not evaluated
    printf("short-circuit AND: evals=%d\n", eval_count);

    eval_count = 0;
    bool r2 = side_true() || side_true(); // second not evaluated
    printf("short-circuit OR: evals=%d\n", eval_count);

    // Const propagation
    const_prop_test();

    // Empty base optimization
    printf("sizeof Empty: %d\n", (int)sizeof(Empty));
    printf("sizeof WithEmpty: %d\n", (int)sizeof(WithEmpty));
    // WithEmpty should be same size as int (empty base optimized away)

    // Anonymous namespace
    printf("hidden: %d\n", hidden_func());

    // Dead store
    dead_store_test();

    // Loop unroll
    printf("unroll sum: %d\n", unroll_sum());

    return 0;
}
