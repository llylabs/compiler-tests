// Test: C++ — class, constructor, destructor, methods
// @expect-exit: 0
// @expect-contains: Point(3,4)
// @expect-contains: dist=5.000
// @expect-contains: moved=Point(6,8)
// @expect-contains: dtor called
#include <cstdio>
#include <cmath>

class Point {
    int x_, y_;
public:
    Point(int x, int y) : x_(x), y_(y) {}
    ~Point() { printf("dtor called\n"); }
    int x() const { return x_; }
    int y() const { return y_; }
    double dist() const { return sqrt((double)(x_ * x_ + y_ * y_)); }
    Point translate(int dx, int dy) const { return Point(x_ + dx, y_ + dy); }
    void print() const { printf("Point(%d,%d)\n", x_, y_); }
};

int main() {
    Point p(3, 4);
    p.print();
    printf("dist=%.3f\n", p.dist());
    Point q = p.translate(3, 4);
    printf("moved=");
    q.print();
    return 0;
}
