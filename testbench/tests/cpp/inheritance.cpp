#include <stdio.h>

class Shape {
public:
    virtual int area() const = 0;
    virtual const char* name() const = 0;
};

class Circle : public Shape {
    int r;
public:
    Circle(int r) : r(r) {}
    int area() const override { return 3 * r * r; }
    const char* name() const override { return "Circle"; }
};

class Square : public Shape {
    int s;
public:
    Square(int s) : s(s) {}
    int area() const override { return s * s; }
    const char* name() const override { return "Square"; }
};

void print_shape(const Shape& sh) {
    printf("%s: area=%d\n", sh.name(), sh.area());
}

int main() {
    Circle c(5);
    Square s(4);
    print_shape(c);
    print_shape(s);
    return 0;
}
