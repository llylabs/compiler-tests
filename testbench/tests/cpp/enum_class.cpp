#include <stdio.h>

enum class Color { Red, Green, Blue, Yellow };
enum class HttpStatus : int { OK = 200, NotFound = 404, ServerError = 500 };

const char *color_name(Color c) {
    switch (c) {
        case Color::Red: return "Red";
        case Color::Green: return "Green";
        case Color::Blue: return "Blue";
        case Color::Yellow: return "Yellow";
        default: return "Unknown";
    }
}

int status_code(HttpStatus s) {
    return static_cast<int>(s);
}

int main() {
    // Enum class usage
    Color c = Color::Blue;
    printf("color: %s\n", color_name(c));

    // Iterate-like
    Color colors[] = {Color::Red, Color::Green, Color::Blue, Color::Yellow};
    for (int i = 0; i < 4; i++) {
        printf("%d: %s\n", i, color_name(colors[i]));
    }

    // Underlying value access
    printf("OK: %d\n", status_code(HttpStatus::OK));
    printf("NotFound: %d\n", status_code(HttpStatus::NotFound));
    printf("ServerError: %d\n", status_code(HttpStatus::ServerError));

    // Comparison
    Color a = Color::Red;
    Color b = Color::Red;
    Color c2 = Color::Blue;
    printf("eq: %d\n", a == b);
    printf("ne: %d\n", a != c2);

    // static_cast to/from int
    int val = static_cast<int>(Color::Blue);
    printf("Blue as int: %d\n", val);
    Color back = static_cast<Color>(val);
    printf("back: %s\n", color_name(back));

    return 0;
}
