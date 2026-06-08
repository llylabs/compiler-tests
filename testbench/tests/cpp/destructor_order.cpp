#include <stdio.h>

struct Resource {
    int id;
    Resource(int i) : id(i) { printf("ctor %d\n", id); }
    ~Resource() { printf("dtor %d\n", id); }
};

void scope_test() {
    Resource a(1);
    {
        Resource b(2);
        Resource c(3);
    } // b,c destroyed here in reverse order
    Resource d(4);
} // d,a destroyed here in reverse order

int main() {
    printf("--- scope test ---\n");
    scope_test();
    printf("--- array ---\n");
    {
        Resource arr[3] = {Resource(10), Resource(11), Resource(12)};
    }
    printf("--- done ---\n");
    return 0;
}
