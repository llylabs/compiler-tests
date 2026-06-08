#include <stdio.h>

enum Color { RED = 0, GREEN = 1, BLUE = 2, YELLOW = 3 };
enum Status { OK = 200, NOT_FOUND = 404, ERROR = 500 };

const char *color_name(enum Color c) {
    switch (c) {
        case RED: return "red";
        case GREEN: return "green";
        case BLUE: return "blue";
        case YELLOW: return "yellow";
        default: return "unknown";
    }
}

const char *status_msg(enum Status s) {
    switch (s) {
        case OK: return "OK";
        case NOT_FOUND: return "Not Found";
        case ERROR: return "Internal Error";
        default: return "Unknown";
    }
}

int main() {
    // Enum iteration
    for (int i = 0; i <= 3; i++) {
        printf("color %d: %s\n", i, color_name((enum Color)i));
    }

    // Non-sequential enum values
    printf("200: %s\n", status_msg(OK));
    printf("404: %s\n", status_msg(NOT_FOUND));
    printf("500: %s\n", status_msg(ERROR));

    // Fallthrough test
    int x = 2;
    int result = 0;
    switch (x) {
        case 1: result += 1;
        case 2: result += 10;
        case 3: result += 100;
            break;
        case 4: result += 1000;
    }
    printf("fallthrough: %d\n", result);

    // Default case
    printf("default: %s\n", color_name((enum Color)99));

    return 0;
}
