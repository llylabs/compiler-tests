fn factorial(n: u64) -> u64 {
    if n <= 1 { 1 } else { n * factorial(n - 1) }
}

fn gcd(a: u64, b: u64) -> u64 {
    if b == 0 { a } else { gcd(b, a % b) }
}

// Mutual recursion
fn is_even(n: u32) -> bool {
    if n == 0 { true } else { is_odd(n - 1) }
}

fn is_odd(n: u32) -> bool {
    if n == 0 { false } else { is_even(n - 1) }
}

// Tree traversal
enum Tree {
    Leaf(i32),
    Node(Box<Tree>, Box<Tree>),
}

fn tree_sum(t: &Tree) -> i32 {
    match t {
        Tree::Leaf(v) => *v,
        Tree::Node(l, r) => tree_sum(l) + tree_sum(r),
    }
}

fn tree_depth(t: &Tree) -> u32 {
    match t {
        Tree::Leaf(_) => 1,
        Tree::Node(l, r) => 1 + tree_depth(l).max(tree_depth(r)),
    }
}

fn main() {
    assert_eq!(factorial(0), 1);
    assert_eq!(factorial(1), 1);
    assert_eq!(factorial(10), 3628800);
    assert_eq!(factorial(20), 2432902008176640000);

    assert_eq!(gcd(12, 8), 4);
    assert_eq!(gcd(54, 24), 6);
    assert_eq!(gcd(0, 5), 5);

    assert!(is_even(100));
    assert!(!is_even(99));
    assert!(is_odd(99));
    assert!(!is_odd(100));

    let tree = Tree::Node(
        Box::new(Tree::Node(
            Box::new(Tree::Leaf(1)),
            Box::new(Tree::Leaf(2)),
        )),
        Box::new(Tree::Node(
            Box::new(Tree::Leaf(3)),
            Box::new(Tree::Node(
                Box::new(Tree::Leaf(4)),
                Box::new(Tree::Leaf(5)),
            )),
        )),
    );
    assert_eq!(tree_sum(&tree), 15);
    assert_eq!(tree_depth(&tree), 4);

    print!("PASS");
}
