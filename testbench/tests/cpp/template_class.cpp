#include <stdio.h>

template<typename T, int MaxSize>
struct Stack {
    T data[MaxSize];
    int top;

    Stack() : top(0) {}

    void push(T val) {
        if (top < MaxSize) data[top++] = val;
    }

    T pop() {
        return data[--top];
    }

    T peek() const { return data[top - 1]; }
    int size() const { return top; }
    bool empty() const { return top == 0; }
};

template<typename T>
T max_val(T a, T b) {
    return a > b ? a : b;
}

template<typename T>
T min_val(T a, T b) {
    return a < b ? a : b;
}

template<typename T>
void swap_val(T &a, T &b) {
    T tmp = a; a = b; b = tmp;
}

int main() {
    // Integer stack
    Stack<int, 10> is;
    is.push(10); is.push(20); is.push(30);
    printf("size: %d\n", is.size());
    printf("peek: %d\n", is.peek());
    printf("pop: %d %d %d\n", is.pop(), is.pop(), is.pop());
    printf("empty: %d\n", is.empty());

    // Double stack
    Stack<double, 5> ds;
    ds.push(1.5); ds.push(2.5);
    printf("double peek: %.1f\n", ds.peek());

    // Template functions
    printf("max(3,7): %d\n", max_val(3, 7));
    printf("max(3.5,2.1): %.1f\n", max_val(3.5, 2.1));
    printf("min(3,7): %d\n", min_val(3, 7));

    // Template swap
    int a = 10, b = 20;
    swap_val(a, b);
    printf("swapped: %d %d\n", a, b);

    return 0;
}
