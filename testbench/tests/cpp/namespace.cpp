#include <stdio.h>

namespace math {
    int abs(int x) { return x < 0 ? -x : x; }
    int max(int a, int b) { return a > b ? a : b; }

    namespace geometry {
        struct Point { int x, y; };

        int distance_sq(Point a, Point b) {
            int dx = a.x - b.x;
            int dy = a.y - b.y;
            return dx * dx + dy * dy;
        }
    }
}

namespace io {
    void print_int(int x) { printf("int: %d\n", x); }
    void print_point(math::geometry::Point p) { printf("(%d, %d)\n", p.x, p.y); }
}

// Using declarations
using io::print_int;

int main() {
    // Fully qualified
    printf("abs(-5): %d\n", math::abs(-5));
    printf("max(3,7): %d\n", math::max(3, 7));

    // Nested namespace
    math::geometry::Point p1 = {0, 0};
    math::geometry::Point p2 = {3, 4};
    printf("dist_sq: %d\n", math::geometry::distance_sq(p1, p2));

    // Using declaration
    print_int(42);

    // Using directive
    {
        using namespace math::geometry;
        Point p3 = {1, 1};
        Point p4 = {4, 5};
        printf("dist_sq2: %d\n", distance_sq(p3, p4));
    }

    io::print_point(p2);

    return 0;
}
