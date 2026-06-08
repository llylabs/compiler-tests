#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

Node *make_node(int val) {
    Node *n = (Node *)malloc(sizeof(Node));
    n->value = val;
    n->next = NULL;
    return n;
}

Node *prepend(Node *head, int val) {
    Node *n = make_node(val);
    n->next = head;
    return n;
}

Node *append(Node *head, int val) {
    Node *n = make_node(val);
    if (!head) return n;
    Node *cur = head;
    while (cur->next) cur = cur->next;
    cur->next = n;
    return head;
}

Node *reverse(Node *head) {
    Node *prev = NULL, *cur = head, *next;
    while (cur) {
        next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}

int length(Node *head) {
    int count = 0;
    while (head) { count++; head = head->next; }
    return count;
}

void print_list(Node *head) {
    while (head) {
        printf("%d", head->value);
        if (head->next) printf(" -> ");
        head = head->next;
    }
    printf("\n");
}

void free_list(Node *head) {
    while (head) {
        Node *tmp = head;
        head = head->next;
        free(tmp);
    }
}

int main() {
    Node *list = NULL;
    for (int i = 1; i <= 5; i++) {
        list = append(list, i * 10);
    }
    printf("list: ");
    print_list(list);
    printf("length: %d\n", length(list));

    list = prepend(list, 5);
    printf("prepend: ");
    print_list(list);

    list = reverse(list);
    printf("reversed: ");
    print_list(list);

    free_list(list);
    printf("done\n");

    return 0;
}
