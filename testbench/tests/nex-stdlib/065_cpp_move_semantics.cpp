// Test: C++ — move semantics, rvalue references, std::move equivalent
// @expect-exit: 0
// @expect-contains: copy ctor
// @expect-contains: move ctor
// @expect-contains: after move: src empty, dst has data
#include <cstdio>
#include <cstring>
#include <cstdlib>

class Buffer {
    char* data_;
    int size_;
public:
    Buffer(const char* s) {
        size_ = strlen(s);
        data_ = (char*)malloc(size_ + 1);
        strcpy(data_, s);
    }
    // Copy constructor
    Buffer(const Buffer& o) {
        printf("copy ctor\n");
        size_ = o.size_;
        data_ = (char*)malloc(size_ + 1);
        strcpy(data_, o.data_);
    }
    // Move constructor
    Buffer(Buffer&& o) noexcept {
        printf("move ctor\n");
        data_ = o.data_;
        size_ = o.size_;
        o.data_ = nullptr;
        o.size_ = 0;
    }
    ~Buffer() { free(data_); }
    bool empty() const { return data_ == nullptr || size_ == 0; }
    const char* c_str() const { return data_ ? data_ : ""; }
};

int main() {
    Buffer a("hello");
    Buffer b(a);  // copy
    Buffer c(static_cast<Buffer&&>(b));  // move (without <utility>)

    printf("after move: src %s, dst %s\n",
        b.empty() ? "empty" : "has data",
        c.empty() ? "empty" : "has data");
    return 0;
}
