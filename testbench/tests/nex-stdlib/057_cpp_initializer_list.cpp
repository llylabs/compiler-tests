// Test: C++ — initializer_list
// @expect-exit: 0
// @expect-contains: sum=15
// @expect-contains: count=5
// @expect-contains: list: 10 20 30
#include <cstdio>
#include <initializer_list>

int sum(std::initializer_list<int> vals) {
    int s = 0;
    for (int v : vals) s += v;
    return s;
}

class IntList {
    int data_[16];
    int size_;
public:
    IntList(std::initializer_list<int> init) : size_(0) {
        for (int v : init) {
            if (size_ < 16) data_[size_++] = v;
        }
    }
    void print() const {
        printf("list:");
        for (int i = 0; i < size_; i++) printf(" %d", data_[i]);
        printf("\n");
    }
};

int main() {
    printf("sum=%d\n", sum({1, 2, 3, 4, 5}));
    printf("count=%d\n", (int)std::initializer_list<int>{1,2,3,4,5}.size());

    IntList l = {10, 20, 30};
    l.print();
    return 0;
}
