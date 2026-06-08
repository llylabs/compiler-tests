trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.title, self.content)
    }
}

struct Tweet {
    user: String,
    body: String,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.user, self.body)
    }
}

fn print_summary(item: &dyn Summary) -> String {
    item.summarize()
}

// Generic function with trait bound
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in &list[1..] {
        if item > largest {
            largest = item;
        }
    }
    largest
}

// Generic struct
struct Wrapper<T> {
    value: T,
}

impl<T: std::fmt::Display> Wrapper<T> {
    fn show(&self) -> String {
        format!("Wrapped: {}", self.value)
    }
}

fn main() {
    let article = Article {
        title: String::from("Breaking News"),
        content: String::from("Something important happened today in the world"),
    };
    let tweet = Tweet {
        user: String::from("user42"),
        body: String::from("Hello world!"),
    };

    // Dynamic dispatch
    assert_eq!(
        print_summary(&article),
        "Breaking News: Something important happened today in the world"
    );
    assert_eq!(print_summary(&tweet), "@user42: Hello world!");

    // Generics
    let numbers = vec![34, 50, 25, 100, 65];
    assert_eq!(*largest(&numbers), 100);

    let chars = vec!['y', 'm', 'a', 'q'];
    assert_eq!(*largest(&chars), 'y');

    // Generic struct
    let w = Wrapper { value: 42 };
    assert_eq!(w.show(), "Wrapped: 42");

    print!("PASS");
}
