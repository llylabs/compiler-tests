#include <stdio.h>

typedef struct { int x, y; } Vec2;
typedef struct { Vec2 pos; Vec2 vel; int id; } Entity;

Entity make_entity(int id, int px, int py, int vx, int vy) {
    Entity e;
    e.id = id;
    e.pos.x = px; e.pos.y = py;
    e.vel.x = vx; e.vel.y = vy;
    return e;
}

Entity move_entity(Entity e) {
    e.pos.x += e.vel.x;
    e.pos.y += e.vel.y;
    return e;
}

void print_entity(Entity e) {
    printf("Entity %d: pos=(%d,%d) vel=(%d,%d)\n", e.id, e.pos.x, e.pos.y, e.vel.x, e.vel.y);
}

int main() {
    Entity a = make_entity(1, 10, 20, 1, -1);
    print_entity(a);

    Entity b = move_entity(a);
    print_entity(b);

    // Struct copy
    Entity c = b;
    c.id = 3;
    c.pos.x = 100;
    print_entity(c);
    // Original unchanged
    print_entity(b);

    // Array of structs
    Entity arr[3];
    for (int i = 0; i < 3; i++) {
        arr[i] = make_entity(i + 10, i * 5, i * 10, i, i + 1);
    }
    for (int i = 0; i < 3; i++) {
        arr[i] = move_entity(arr[i]);
        print_entity(arr[i]);
    }

    return 0;
}
