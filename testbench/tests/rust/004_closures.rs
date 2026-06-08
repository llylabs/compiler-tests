fn apply<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(x)
}

fn make_adder(n: i32) -> Box<dyn Fn(i32) -> i32> {
    Box::new(move |x| x + n)
}

fn main() {
    // Basic closure
    let double = |x: i32| x * 2;
    assert_eq!(double(5), 10);

    // Closure capturing by reference
    let offset = 100;
    let add_offset = |x: i32| x + offset;
    assert_eq!(add_offset(42), 142);

    // Closure as function argument
    assert_eq!(apply(|x| x * x, 7), 49);

    // Closure returning closure (boxed)
    let add5 = make_adder(5);
    assert_eq!(add5(10), 15);
    let add100 = make_adder(100);
    assert_eq!(add100(1), 101);

    // FnMut
    let mut counter = 0;
    let mut inc = || { counter += 1; counter };
    assert_eq!(inc(), 1);
    assert_eq!(inc(), 2);
    assert_eq!(inc(), 3);

    // Iterator with closures
    let v: Vec<i32> = (1..=5).map(|x| x * x).collect();
    assert_eq!(v, vec![1, 4, 9, 16, 25]);

    let sum: i32 = v.iter().filter(|&&x| x > 5).sum();
    assert_eq!(sum, 9 + 16 + 25);

    print!("PASS");
}
