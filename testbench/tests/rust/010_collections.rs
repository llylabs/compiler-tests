use std::collections::HashMap;

fn main() {
    // Vec
    let mut v = vec![5, 3, 1, 4, 2];
    v.sort();
    assert_eq!(v, vec![1, 2, 3, 4, 5]);
    v.reverse();
    assert_eq!(v, vec![5, 4, 3, 2, 1]);
    v.retain(|&x| x > 2);
    assert_eq!(v, vec![5, 4, 3]);
    v.insert(1, 99);
    assert_eq!(v, vec![5, 99, 4, 3]);
    assert_eq!(v.remove(1), 99);

    // String
    let mut s = String::from("Hello");
    s.push(' ');
    s.push_str("World");
    assert_eq!(s, "Hello World");
    assert_eq!(s.len(), 11);
    assert!(s.contains("World"));
    assert!(s.starts_with("Hello"));
    let upper = s.to_uppercase();
    assert_eq!(upper, "HELLO WORLD");

    // HashMap
    let mut map = HashMap::new();
    map.insert("one", 1);
    map.insert("two", 2);
    map.insert("three", 3);
    assert_eq!(map.get("two"), Some(&2));
    assert_eq!(map.get("four"), None);
    assert!(map.contains_key("one"));
    assert_eq!(map.len(), 3);

    // entry API
    map.entry("four").or_insert(4);
    assert_eq!(map["four"], 4);

    *map.entry("one").or_insert(0) += 10;
    assert_eq!(map["one"], 11);

    // Word count
    let text = "hello world hello rust hello";
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    assert_eq!(counts["hello"], 3);
    assert_eq!(counts["world"], 1);
    assert_eq!(counts["rust"], 1);

    print!("PASS");
}
