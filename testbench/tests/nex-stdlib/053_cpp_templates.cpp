// Test: C++ — function templates, class templates
// @expect-exit: 0
// @expect-contains: max(3,7)=7
// @expect-contains: max(3.14,2.71)=3.140
// @expect-contains: stack: 30 20 10
// @expect-contains: stack empty: 1
#include <cstdio>

template<typename T>
T max_of(T a, T b) { return a > b ? a : b; }

template<typename T, int N>
class Stack {
    T data_[N];
    int top_;
public:
    Stack() : top_(0) {}
    void push(T val) { if (top_ < N) data_[top_++] = val; }
    T pop() { return data_[--top_]; }
    bool empty() const { return top_ == 0; }
    int size() const { return top_; }
};

int main() {
    printf("max(3,7)=%d\n", max_of(3, 7));
    printf("max(3.14,2.71)=%.3f\n", max_of(3.14, 2.71));

    Stack<int, 10> s;
    s.push(10);
    s.push(20);
    s.push(30);
    printf("stack:");
    while (!s.empty()) printf(" %d", s.pop());
    printf("\n");
    printf("stack empty: %d\n", s.empty());
    return 0;
}
