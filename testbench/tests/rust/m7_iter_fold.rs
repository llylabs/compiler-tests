fn main() {
    let sum: i64 = (1..=100).fold(0i64, |a, b| a + b);
    println!("sum={}", sum);
}
