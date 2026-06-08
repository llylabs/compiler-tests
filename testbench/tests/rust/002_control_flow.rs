fn fib(n: u32) -> u32 {
    if n <= 1 { return n; }
    let mut a = 0u32;
    let mut b = 1u32;
    for _ in 2..=n {
        let c = a + b;
        a = b;
        b = c;
    }
    b
}

fn main() {
    assert_eq!(fib(0), 0);
    assert_eq!(fib(1), 1);
    assert_eq!(fib(10), 55);
    assert_eq!(fib(20), 6765);

    // while loop
    let mut sum = 0;
    let mut i = 1;
    while i <= 100 {
        sum += i;
        i += 1;
    }
    assert_eq!(sum, 5050);

    // loop + break
    let mut x = 0;
    let result = loop {
        x += 1;
        if x == 10 { break x * 2; }
    };
    assert_eq!(result, 20);

    print!("PASS");
}
