#include <stdio.h>

class Rectangle {
    int w, h;
public:
    Rectangle(int w, int h) : w(w), h(h) {}
    int area() const { return w * h; }
    int perimeter() const { return 2 * (w + h); }
};

int main() {
    Rectangle r(5, 3);
    printf("area=%d perimeter=%d\n", r.area(), r.perimeter());
    return 0;
}
