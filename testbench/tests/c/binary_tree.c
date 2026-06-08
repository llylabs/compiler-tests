#include <stdio.h>
#include <stdlib.h>

typedef struct TreeNode {
    int key;
    struct TreeNode *left, *right;
} TreeNode;

TreeNode *new_node(int key) {
    TreeNode *n = (TreeNode *)malloc(sizeof(TreeNode));
    n->key = key;
    n->left = n->right = NULL;
    return n;
}

TreeNode *insert(TreeNode *root, int key) {
    if (!root) return new_node(key);
    if (key < root->key) root->left = insert(root->left, key);
    else if (key > root->key) root->right = insert(root->right, key);
    return root;
}

int search(TreeNode *root, int key) {
    if (!root) return 0;
    if (key == root->key) return 1;
    if (key < root->key) return search(root->left, key);
    return search(root->right, key);
}

void inorder(TreeNode *root) {
    if (!root) return;
    inorder(root->left);
    printf("%d ", root->key);
    inorder(root->right);
}

int height(TreeNode *root) {
    if (!root) return 0;
    int lh = height(root->left);
    int rh = height(root->right);
    return 1 + (lh > rh ? lh : rh);
}

int count(TreeNode *root) {
    if (!root) return 0;
    return 1 + count(root->left) + count(root->right);
}

void free_tree(TreeNode *root) {
    if (!root) return;
    free_tree(root->left);
    free_tree(root->right);
    free(root);
}

int main() {
    TreeNode *root = NULL;
    int keys[] = {50, 30, 70, 20, 40, 60, 80, 10};
    for (int i = 0; i < 8; i++) {
        root = insert(root, keys[i]);
    }

    printf("inorder: ");
    inorder(root);
    printf("\n");

    printf("count: %d\n", count(root));
    printf("height: %d\n", height(root));

    printf("search 40: %s\n", search(root, 40) ? "found" : "not found");
    printf("search 45: %s\n", search(root, 45) ? "found" : "not found");
    printf("search 10: %s\n", search(root, 10) ? "found" : "not found");

    free_tree(root);
    printf("done\n");

    return 0;
}
