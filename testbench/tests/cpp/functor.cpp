#include <stdio.h>

struct Adder {
    int offset;
    Adder(int o) : offset(o) {}
    int operator()(int x) const { return x + offset; }
};

struct Multiplier {
    int factor;
    Multiplier(int f) : factor(f) {}
    int operator()(int x) const { return x * factor; }
};

struct Predicate {
    int threshold;
    Predicate(int t) : threshold(t) {}
    bool operator()(int x) const { return x > threshold; }
};

template<typename Func>
void transform_array(int *arr, int n, Func fn) {
    for (int i = 0; i < n; i++) arr[i] = fn(arr[i]);
}

template<typename Pred>
int count_if(int *arr, int n, Pred pred) {
    int c = 0;
    for (int i = 0; i < n; i++) if (pred(arr[i])) c++;
    return c;
}

int main() {
    Adder add5(5);
    printf("add5(10) = %d\n", add5(10));
    printf("add5(20) = %d\n", add5(20));

    Multiplier mul3(3);
    printf("mul3(7) = %d\n", mul3(7));

    int arr[] = {1, 2, 3, 4, 5};
    transform_array(arr, 5, Adder(10));
    printf("added 10:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    transform_array(arr, 5, Multiplier(2));
    printf("times 2:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");

    printf("count > 25: %d\n", count_if(arr, 5, Predicate(25)));

    return 0;
}
