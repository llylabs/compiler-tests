#include <stdio.h>

struct Vec2 {
    double x, y;
    Vec2(double x = 0, double y = 0) : x(x), y(y) {}

    Vec2 operator+(const Vec2 &o) const { return Vec2(x + o.x, y + o.y); }
    Vec2 operator-(const Vec2 &o) const { return Vec2(x - o.x, y - o.y); }
    Vec2 operator*(double s) const { return Vec2(x * s, y * s); }
    bool operator==(const Vec2 &o) const { return x == o.x && y == o.y; }
    bool operator!=(const Vec2 &o) const { return !(*this == o); }
    double operator[](int i) const { return i == 0 ? x : y; }

    void print() const { printf("(%.1f, %.1f)\n", x, y); }
};

struct Counter {
    int val;
    Counter(int v = 0) : val(v) {}
    Counter &operator++() { ++val; return *this; }    // prefix
    Counter operator++(int) { Counter old = *this; ++val; return old; } // postfix
    Counter &operator+=(int n) { val += n; return *this; }
};

int main() {
    Vec2 a(1.0, 2.0);
    Vec2 b(3.0, 4.0);

    (a + b).print();
    (b - a).print();
    (a * 3.0).print();

    printf("eq: %d\n", a == Vec2(1.0, 2.0));
    printf("ne: %d\n", a != b);
    printf("a[0]=%.1f a[1]=%.1f\n", a[0], a[1]);

    // Pre/post increment
    Counter c(10);
    Counter old = c++;
    printf("post++: old=%d new=%d\n", old.val, c.val);
    ++c;
    printf("pre++: %d\n", c.val);
    c += 5;
    printf("+=5: %d\n", c.val);

    return 0;
}
