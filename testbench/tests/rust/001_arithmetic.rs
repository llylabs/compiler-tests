fn main() {
    assert_eq!(2 + 3, 5);
    assert_eq!(10 - 4, 6);
    assert_eq!(3 * 7, 21);
    assert_eq!(20 / 4, 5);
    assert_eq!(17 % 5, 2);
    assert_eq!(-5i32, -5);
    assert_eq!(i32::MAX, 2147483647);
    assert_eq!(i32::MIN, -2147483648);
    // wrapping
    assert_eq!(i32::MAX.wrapping_add(1), i32::MIN);
    print!("PASS");
}
