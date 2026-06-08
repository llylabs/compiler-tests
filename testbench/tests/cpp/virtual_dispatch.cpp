#include <stdio.h>

struct Shape {
    virtual const char *name() { return "Shape"; }
    virtual int area() { return 0; }
    virtual ~Shape() {}
};

struct Rectangle : Shape {
    int w, h;
    Rectangle(int w, int h) : w(w), h(h) {}
    const char *name() { return "Rectangle"; }
    int area() { return w * h; }
};

struct Circle : Shape {
    int r;
    Circle(int r) : r(r) {}
    const char *name() { return "Circle"; }
    int area() { return 3 * r * r; } // approximate
};

struct Square : Rectangle {
    Square(int s) : Rectangle(s, s) {}
    const char *name() { return "Square"; }
};

void print_shape(Shape *s) {
    printf("%s: area=%d\n", s->name(), s->area());
}

int main() {
    Rectangle r(5, 3);
    Circle c(4);
    Square sq(6);

    // Direct calls
    print_shape(&r);
    print_shape(&c);
    print_shape(&sq);

    // Via base pointer array
    Shape *shapes[] = {&r, &c, &sq};
    printf("--- array ---\n");
    for (int i = 0; i < 3; i++) {
        print_shape(shapes[i]);
    }

    return 0;
}
