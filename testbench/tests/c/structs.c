#include <stdio.h>

typedef struct {
    int x, y;
} Point;

Point add(Point a, Point b) {
    return (Point){a.x + b.x, a.y + b.y};
}

int main() {
    Point p1 = {3, 4};
    Point p2 = {10, 20};
    Point p3 = add(p1, p2);
    printf("(%d, %d)\n", p3.x, p3.y);
    return 0;
}
