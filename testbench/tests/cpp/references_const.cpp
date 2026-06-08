#include <stdio.h>

void swap_ref(int &a, int &b) {
    int tmp = a; a = b; b = tmp;
}

int &max_ref(int &a, int &b) {
    return a > b ? a : b;
}

void print_const_ref(const int &val) {
    printf("const ref: %d\n", val);
}

struct Config {
    int width, height;
    const char *name;
};

void print_config(const Config &cfg) {
    printf("config: %s %dx%d\n", cfg.name, cfg.width, cfg.height);
}

int main() {
    // Basic references
    int x = 10, y = 20;
    int &rx = x;
    rx = 30;
    printf("x after ref assign: %d\n", x);

    // Swap via reference
    int a = 100, b = 200;
    swap_ref(a, b);
    printf("swapped: %d %d\n", a, b);

    // Reference return
    int p = 5, q = 8;
    max_ref(p, q) = 99;
    printf("after max_ref assign: p=%d q=%d\n", p, q);

    // Const reference (binds to temporary)
    print_const_ref(42);
    print_const_ref(x);

    // Const ref to struct
    Config cfg = {1920, 1080, "display"};
    print_config(cfg);

    // Reference to array element
    int arr[] = {10, 20, 30};
    int &mid = arr[1];
    mid = 99;
    printf("arr[1] via ref: %d\n", arr[1]);

    return 0;
}
