// Test: Functions with different parameter/return types crossing brick boundaries
// @expect-exit: 0
// @expect-contains: 3.14 42 A
#include <stdio.h>
double get_pi() { return 3.14159; }
int get_answer() { return 42; }
char get_letter() { return 'A'; }
void print_all() {
    printf("%.2f %d %c\n", get_pi(), get_answer(), get_letter());
}
int main() {
    print_all();
    return 0;
}
