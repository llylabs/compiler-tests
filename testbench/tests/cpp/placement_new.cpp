#include <stdio.h>
#include <new>

struct Widget {
    int id;
    Widget(int i) : id(i) { printf("Widget(%d)\n", id); }
    ~Widget() { printf("~Widget(%d)\n", id); }
};

int main() {
    // Placement new - construct in pre-allocated memory
    char buffer[sizeof(Widget)];
    Widget *w = new (buffer) Widget(42);
    printf("w->id = %d\n", w->id);
    w->~Widget(); // Manual destructor call

    // Multiple objects in array
    char pool[sizeof(Widget) * 3];
    Widget *arr[3];
    for (int i = 0; i < 3; i++) {
        arr[i] = new (pool + i * sizeof(Widget)) Widget(i + 10);
    }
    printf("arr:");
    for (int i = 0; i < 3; i++) printf(" %d", arr[i]->id);
    printf("\n");

    // Destroy in reverse order
    for (int i = 2; i >= 0; i--) {
        arr[i]->~Widget();
    }

    printf("done\n");
    return 0;
}
