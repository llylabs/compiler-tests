struct Counter {
    count: u32,
    max: u32,
}

impl Counter {
    fn new(max: u32) -> Self {
        Counter { count: 0, max }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    // Custom iterator
    let sum: u32 = Counter::new(5).sum();
    assert_eq!(sum, 15);

    // Chained iterators
    let v: Vec<u32> = Counter::new(5)
        .zip(Counter::new(5).skip(1))
        .map(|(a, b)| a * b)
        .filter(|&x| x > 5)
        .collect();
    assert_eq!(v, vec![6, 12, 20]);

    // Standard iterator methods
    let data = vec![3, 1, 4, 1, 5, 9, 2, 6];

    assert_eq!(data.iter().min(), Some(&1));
    assert_eq!(data.iter().max(), Some(&9));
    assert_eq!(data.iter().count(), 8);

    let product: i32 = vec![1, 2, 3, 4, 5].iter().product();
    assert_eq!(product, 120);

    // enumerate
    let chars = vec!['a', 'b', 'c'];
    let indexed: Vec<(usize, &char)> = chars.iter().enumerate().collect();
    assert_eq!(indexed, vec![(0, &'a'), (1, &'b'), (2, &'c')]);

    // fold
    let sentence = vec!["hello", "world", "foo"];
    let joined = sentence.iter().fold(String::new(), |mut acc, &s| {
        if !acc.is_empty() { acc.push(' '); }
        acc.push_str(s);
        acc
    });
    assert_eq!(joined, "hello world foo");

    // any / all
    assert!(data.iter().any(|&x| x > 8));
    assert!(!data.iter().all(|&x| x > 2));

    print!("PASS");
}
