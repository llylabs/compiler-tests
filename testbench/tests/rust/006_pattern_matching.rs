enum Expr {
    Num(i64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Neg(Box<Expr>),
}

fn eval(expr: &Expr) -> i64 {
    match expr {
        Expr::Num(n) => *n,
        Expr::Add(a, b) => eval(a) + eval(b),
        Expr::Mul(a, b) => eval(a) * eval(b),
        Expr::Neg(e) => -eval(e),
    }
}

fn classify(n: i32) -> &'static str {
    match n {
        i32::MIN..=-1 => "negative",
        0 => "zero",
        1..=100 => "small positive",
        _ => "large positive",
    }
}

fn main() {
    // Recursive enum evaluation
    let expr = Expr::Add(
        Box::new(Expr::Mul(
            Box::new(Expr::Num(3)),
            Box::new(Expr::Num(4)),
        )),
        Box::new(Expr::Neg(Box::new(Expr::Num(2)))),
    );
    assert_eq!(eval(&expr), 10); // 3*4 + (-2)

    // Range patterns
    assert_eq!(classify(-5), "negative");
    assert_eq!(classify(0), "zero");
    assert_eq!(classify(50), "small positive");
    assert_eq!(classify(1000), "large positive");

    // Destructuring
    let (a, b, c) = (1, 2, 3);
    assert_eq!(a + b + c, 6);

    // if let
    let opt: Option<i32> = Some(42);
    if let Some(val) = opt {
        assert_eq!(val, 42);
    } else {
        panic!("expected Some");
    }

    // while let
    let mut stack = vec![1, 2, 3];
    let mut sum = 0;
    while let Some(top) = stack.pop() {
        sum += top;
    }
    assert_eq!(sum, 6);

    // Nested pattern
    let nested: Option<Option<i32>> = Some(Some(7));
    match nested {
        Some(Some(n)) => assert_eq!(n, 7),
        _ => panic!("wrong pattern"),
    }

    print!("PASS");
}
