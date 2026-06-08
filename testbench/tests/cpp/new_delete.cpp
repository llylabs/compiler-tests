#include <stdio.h>

struct Obj {
    int id;
    Obj(int i) : id(i) { printf("new Obj(%d)\n", id); }
    ~Obj() { printf("del Obj(%d)\n", id); }
};

int main() {
    // Single new/delete
    Obj *a = new Obj(1);
    printf("a->id = %d\n", a->id);
    delete a;

    // Array new/delete
    printf("--- array ---\n");
    int *arr = new int[5];
    for (int i = 0; i < 5; i++) arr[i] = (i + 1) * 10;
    printf("arr:");
    for (int i = 0; i < 5; i++) printf(" %d", arr[i]);
    printf("\n");
    delete[] arr;

    // New with constructor
    printf("--- obj array ---\n");
    Obj *objs = new Obj[3]{Obj(10), Obj(11), Obj(12)};
    delete[] objs;

    // Pointer to new
    printf("--- chain ---\n");
    int *p = new int(42);
    printf("*p = %d\n", *p);
    delete p;

    printf("done\n");
    return 0;
}
