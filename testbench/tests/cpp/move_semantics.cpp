#include <stdio.h>

struct Buffer {
    int *data;
    int size;
    int id;

    Buffer(int sz, int i) : size(sz), id(i) {
        data = new int[sz];
        for (int j = 0; j < sz; j++) data[j] = j + 1;
        printf("ctor %d (size=%d)\n", id, size);
    }

    // Copy constructor
    Buffer(const Buffer &other) : size(other.size), id(other.id + 100) {
        data = new int[size];
        for (int i = 0; i < size; i++) data[i] = other.data[i];
        printf("copy %d from %d\n", id, other.id);
    }

    // Move constructor
    Buffer(Buffer &&other) : data(other.data), size(other.size), id(other.id + 200) {
        other.data = nullptr;
        other.size = 0;
        printf("move %d from %d\n", id, other.id);
    }

    // Copy assignment
    Buffer &operator=(const Buffer &other) {
        if (this != &other) {
            delete[] data;
            size = other.size;
            data = new int[size];
            for (int i = 0; i < size; i++) data[i] = other.data[i];
            printf("copy-assign from %d\n", other.id);
        }
        return *this;
    }

    // Move assignment
    Buffer &operator=(Buffer &&other) {
        if (this != &other) {
            delete[] data;
            data = other.data;
            size = other.size;
            other.data = nullptr;
            other.size = 0;
            printf("move-assign from %d\n", other.id);
        }
        return *this;
    }

    ~Buffer() {
        printf("dtor %d (data=%s)\n", id, data ? "valid" : "null");
        delete[] data;
    }

    int sum() const {
        int s = 0;
        for (int i = 0; i < size; i++) s += data[i];
        return s;
    }
};

Buffer make_buffer(int sz, int id) {
    return Buffer(sz, id);
}

int main() {
    // Move constructor via static_cast to rvalue
    printf("--- move ctor ---\n");
    Buffer a(3, 1);
    Buffer b(static_cast<Buffer&&>(a));
    printf("b.sum=%d a.data=%s\n", b.sum(), a.data ? "valid" : "null");

    // Copy constructor
    printf("--- copy ctor ---\n");
    Buffer c(4, 2);
    Buffer d(c);
    printf("c.sum=%d d.sum=%d\n", c.sum(), d.sum());

    // Move from return value (RVO may elide)
    printf("--- return value ---\n");
    Buffer e = make_buffer(5, 3);
    printf("e.sum=%d\n", e.sum());

    printf("--- done ---\n");
    return 0;
}
