fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("division by zero"))
    } else {
        Ok(a / b)
    }
}

fn find_first_even(numbers: &[i32]) -> Option<i32> {
    numbers.iter().find(|&&x| x % 2 == 0).copied()
}

fn chain_operations(x: i32) -> Option<i32> {
    Some(x)
        .filter(|&v| v > 0)
        .map(|v| v * 2)
        .and_then(|v| if v < 100 { Some(v) } else { None })
}

fn main() {
    // Result
    assert_eq!(divide(10.0, 3.0).unwrap(), 10.0 / 3.0);
    assert!(divide(1.0, 0.0).is_err());

    // Option
    assert_eq!(find_first_even(&[1, 3, 4, 5]), Some(4));
    assert_eq!(find_first_even(&[1, 3, 5]), None);

    // Chaining
    assert_eq!(chain_operations(10), Some(20));
    assert_eq!(chain_operations(-5), None);   // filtered out (< 0)
    assert_eq!(chain_operations(100), None);  // too large after *2

    // unwrap_or / unwrap_or_else
    let opt: Option<i32> = None;
    assert_eq!(opt.unwrap_or(42), 42);
    assert_eq!(opt.unwrap_or_else(|| 7 * 6), 42);

    // map_or
    let opt2: Option<String> = Some(String::from("hello"));
    assert_eq!(opt2.as_deref().map_or(0, |s| s.len()), 5);

    // Result to Option
    let r: Result<i32, &str> = Ok(42);
    assert_eq!(r.ok(), Some(42));
    let r2: Result<i32, &str> = Err("oops");
    assert_eq!(r2.ok(), None);

    // ? operator equivalent via and_then
    fn try_parse(s: &str) -> Option<i32> {
        s.parse::<i32>().ok()
    }
    assert_eq!(try_parse("42"), Some(42));
    assert_eq!(try_parse("abc"), None);

    print!("PASS");
}
