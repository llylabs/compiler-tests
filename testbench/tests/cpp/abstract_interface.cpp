#include <stdio.h>

// Pure abstract interface
struct Drawable {
    virtual void draw() const = 0;
    virtual int area() const = 0;
    virtual ~Drawable() {}
};

struct Resizable {
    virtual void resize(int factor) = 0;
    virtual ~Resizable() {}
};

struct Rect : Drawable, Resizable {
    int w, h;
    Rect(int w, int h) : w(w), h(h) {}
    void draw() const { printf("Rect %dx%d\n", w, h); }
    int area() const { return w * h; }
    void resize(int f) { w *= f; h *= f; }
};

struct Circle : Drawable {
    int r;
    Circle(int r) : r(r) {}
    void draw() const { printf("Circle r=%d\n", r); }
    int area() const { return 3 * r * r; }
};

void render(const Drawable &d) {
    d.draw();
    printf("  area=%d\n", d.area());
}

int main() {
    Rect r(3, 4);
    Circle c(5);

    render(r);
    render(c);

    // Resize through interface
    Resizable *rs = &r;
    rs->resize(2);
    render(r);

    // Array of interface pointers
    Drawable *shapes[] = {&r, &c};
    printf("total area:");
    int total = 0;
    for (int i = 0; i < 2; i++) total += shapes[i]->area();
    printf(" %d\n", total);

    return 0;
}
