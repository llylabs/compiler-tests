#include <stdio.h>

struct Entity {
    int x, y, hp;
    Entity(int x, int y, int hp) : x(x), y(y), hp(hp) {}

    int get_x() const { return x; }
    int get_y() const { return y; }
    int get_hp() const { return hp; }
    void damage(int d) { hp -= d; if (hp < 0) hp = 0; }
};

int main() {
    Entity e(10, 20, 100);

    // Pointer to member data
    int Entity::*field = &Entity::x;
    printf("x via ptr: %d\n", e.*field);
    field = &Entity::y;
    printf("y via ptr: %d\n", e.*field);
    field = &Entity::hp;
    printf("hp via ptr: %d\n", e.*field);

    // Modify via member pointer
    e.*field = 50;
    printf("hp after modify: %d\n", e.hp);

    // Pointer to member function
    int (Entity::*getter)() const = &Entity::get_x;
    printf("get_x via ptr: %d\n", (e.*getter)());
    getter = &Entity::get_hp;
    printf("get_hp via ptr: %d\n", (e.*getter)());

    // Member pointer with pointer to object
    Entity *ep = &e;
    printf("via ->*: %d\n", (ep->*getter)());

    // Array of member data pointers
    int Entity::*fields[] = {&Entity::x, &Entity::y, &Entity::hp};
    printf("all fields:");
    for (int i = 0; i < 3; i++) {
        printf(" %d", e.*fields[i]);
    }
    printf("\n");

    return 0;
}
