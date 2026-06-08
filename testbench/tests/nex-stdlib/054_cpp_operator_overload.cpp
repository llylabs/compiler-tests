// Test: C++ — operator overloading (+, ==, <<, [])
// @expect-exit: 0
// @expect-contains: v1+v2 = Vec2(4,6)
// @expect-contains: v1==v1: 1
// @expect-contains: v1==v2: 0
// @expect-contains: arr[2]=30
#include <cstdio>

struct Vec2 {
    int x, y;
    Vec2(int x, int y) : x(x), y(y) {}
    Vec2 operator+(const Vec2& o) const { return Vec2(x + o.x, y + o.y); }
    bool operator==(const Vec2& o) const { return x == o.x && y == o.y; }
};

class Array {
    int data_[5];
public:
    Array() { for (int i = 0; i < 5; i++) data_[i] = (i + 1) * 10; }
    int& operator[](int i) { return data_[i]; }
};

int main() {
    Vec2 v1(1, 2), v2(3, 4);
    Vec2 v3 = v1 + v2;
    printf("v1+v2 = Vec2(%d,%d)\n", v3.x, v3.y);
    printf("v1==v1: %d\n", v1 == v1);
    printf("v1==v2: %d\n", v1 == v2);

    Array a;
    printf("arr[2]=%d\n", a[2]);
    return 0;
}
