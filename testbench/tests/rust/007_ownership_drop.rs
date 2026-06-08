static mut DROP_COUNT: i32 = 0;

struct Droppable {
    id: i32,
}

impl Drop for Droppable {
    fn drop(&mut self) {
        unsafe { DROP_COUNT += 1; }
    }
}

fn take_ownership(d: Droppable) -> i32 {
    d.id
}

fn main() {
    // Basic ownership transfer
    {
        let d1 = Droppable { id: 1 };
        let d2 = Droppable { id: 2 };
        assert_eq!(take_ownership(d1), 1);
        // d1 dropped inside take_ownership
        assert_eq!(unsafe { DROP_COUNT }, 1);
        // d2 drops at end of scope
    }
    assert_eq!(unsafe { DROP_COUNT }, 2);

    // Vec drop
    unsafe { DROP_COUNT = 0; }
    {
        let mut v = Vec::new();
        v.push(Droppable { id: 10 });
        v.push(Droppable { id: 20 });
        v.push(Droppable { id: 30 });
        assert_eq!(unsafe { DROP_COUNT }, 0);
    }
    assert_eq!(unsafe { DROP_COUNT }, 3);

    // Clone vs Move
    let s1 = String::from("hello");
    let s2 = s1.clone();
    // s1 still valid because we cloned
    assert_eq!(s1, "hello");
    assert_eq!(s2, "hello");

    // Box
    let boxed = Box::new(42);
    assert_eq!(*boxed, 42);

    print!("PASS");
}
