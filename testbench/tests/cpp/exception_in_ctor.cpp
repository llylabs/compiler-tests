#include <stdio.h>

static int alive = 0;

struct Member {
    int id;
    Member(int i, bool should_throw = false) : id(i) {
        alive++;
        printf("Member %d constructed: alive=%d\n", id, alive);
        if (should_throw) {
            printf("Member %d throws\n", id);
            throw 99;
        }
    }
    ~Member() {
        alive--;
        printf("Member %d destructed: alive=%d\n", id, alive);
    }
};

struct Container {
    Member a;
    Member b;
    Member c;
    // b throws → a must be destroyed, c never constructed
    Container() : a(1), b(2, true), c(3) {
        printf("Container body (should not reach)\n");
    }
    ~Container() {
        printf("~Container (should not reach)\n");
    }
};

int main() {
    try {
        Container cont;
    } catch (int val) {
        printf("caught: %d alive=%d\n", val, alive);
    }
    printf("done: alive=%d\n", alive);
    return 0;
}
