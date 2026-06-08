trait Animal {
    fn name(&self) -> &str;
    fn sound(&self) -> &str;
    fn info(&self) -> String {
        format!("The {} says {}", self.name(), self.sound())
    }
}

struct Dog { name: String }
struct Cat { name: String }
struct Duck;

impl Animal for Dog {
    fn name(&self) -> &str { &self.name }
    fn sound(&self) -> &str { "woof" }
}

impl Animal for Cat {
    fn name(&self) -> &str { &self.name }
    fn sound(&self) -> &str { "meow" }
}

impl Animal for Duck {
    fn name(&self) -> &str { "duck" }
    fn sound(&self) -> &str { "quack" }
}

fn loudest_sound<'a>(animals: &'a [&'a dyn Animal]) -> &'a str {
    let mut longest: &str = "";
    for a in animals {
        let s = a.sound();
        if s.len() > longest.len() {
            longest = s;
        }
    }
    longest
}

fn main() {
    let dog = Dog { name: String::from("Rex") };
    let cat = Cat { name: String::from("Whiskers") };
    let duck = Duck;

    // Dynamic dispatch via trait objects
    let animals: Vec<&dyn Animal> = vec![&dog, &cat, &duck];

    assert_eq!(animals[0].info(), "The Rex says woof");
    assert_eq!(animals[1].info(), "The Whiskers says meow");
    assert_eq!(animals[2].info(), "The duck says quack");

    assert_eq!(loudest_sound(&animals), "quack");

    // Boxed trait objects
    let boxed_animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog { name: String::from("Buddy") }),
        Box::new(Cat { name: String::from("Luna") }),
    ];
    assert_eq!(boxed_animals[0].name(), "Buddy");
    assert_eq!(boxed_animals[1].sound(), "meow");

    print!("PASS");
}
