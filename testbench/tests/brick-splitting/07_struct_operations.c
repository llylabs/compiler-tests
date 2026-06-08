// Test: Struct passing between functions across potential brick boundaries
// @expect-exit: 0
// @expect-contains: 5.0
#include <stdio.h>
#include <math.h>
typedef struct { double x, y; } Point;
Point make_point(double x, double y) { Point p = {x, y}; return p; }
double distance(Point a, Point b) {
    double dx = a.x - b.x, dy = a.y - b.y;
    return sqrt(dx * dx + dy * dy);
}
int main() {
    Point a = make_point(0, 0);
    Point b = make_point(3, 4);
    printf("%.1f\n", distance(a, b));
    return 0;
}
