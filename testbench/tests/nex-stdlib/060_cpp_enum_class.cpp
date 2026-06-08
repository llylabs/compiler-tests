// Test: C++ — enum class, scoped enums
// @expect-exit: 0
// @expect-contains: Red=0
// @expect-contains: Green=1
// @expect-contains: Blue=2
// @expect-contains: is red: 1
// @expect-contains: typed val=100
#include <cstdio>

enum class Color { Red, Green, Blue };

enum class Typed : unsigned char {
    A = 100,
    B = 200
};

const char* color_name(Color c) {
    switch (c) {
        case Color::Red: return "Red";
        case Color::Green: return "Green";
        case Color::Blue: return "Blue";
    }
    return "?";
}

int main() {
    printf("Red=%d\n", (int)Color::Red);
    printf("Green=%d\n", (int)Color::Green);
    printf("Blue=%d\n", (int)Color::Blue);

    Color c = Color::Red;
    printf("is red: %d\n", c == Color::Red);

    Typed t = Typed::A;
    printf("typed val=%d\n", (int)t);

    return 0;
}
