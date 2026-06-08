struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Self {
        Point { x, y }
    }

    fn manhattan_distance(&self, other: &Point) -> i32 {
        (self.x - other.x).abs() + (self.y - other.y).abs()
    }
}

#[derive(Debug, PartialEq)]
enum Shape {
    Circle(f64),
    Rectangle(f64, f64),
    Triangle { base: f64, height: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(r) => std::f64::consts::PI * r * r,
            Shape::Rectangle(w, h) => w * h,
            Shape::Triangle { base, height } => 0.5 * base * height,
        }
    }
}

fn main() {
    let p1 = Point::new(1, 2);
    let p2 = Point::new(4, 6);
    assert_eq!(p1.manhattan_distance(&p2), 7);

    let shapes = [
        Shape::Rectangle(3.0, 4.0),
        Shape::Triangle { base: 6.0, height: 4.0 },
    ];
    assert_eq!(shapes[0].area(), 12.0);
    assert_eq!(shapes[1].area(), 12.0);

    // Tuple struct
    struct Pair(i32, i32);
    let p = Pair(10, 20);
    assert_eq!(p.0 + p.1, 30);

    // Unit struct
    struct Unit;
    let _u = Unit;

    print!("PASS");
}
