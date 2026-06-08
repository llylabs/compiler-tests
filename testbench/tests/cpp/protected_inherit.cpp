#include <stdio.h>

class Base {
public:
    int pub;
protected:
    int prot;
private:
    int priv;
public:
    Base(int a, int b, int c) : pub(a), prot(b), priv(c) {}
    int get_priv() const { return priv; }
    virtual void info() const { printf("Base pub=%d prot=%d\n", pub, prot); }
};

class PublicChild : public Base {
public:
    PublicChild(int a, int b, int c) : Base(a, b, c) {}
    void show() const {
        printf("PublicChild: pub=%d prot=%d\n", pub, prot);
        // priv not accessible
    }
};

class ProtectedChild : protected Base {
public:
    ProtectedChild(int a, int b, int c) : Base(a, b, c) {}
    void show() const {
        printf("ProtectedChild: pub=%d prot=%d\n", pub, prot);
    }
    // Re-expose something
    using Base::get_priv;
};

class PrivateChild : Base {
public:
    PrivateChild(int a, int b, int c) : Base(a, b, c) {}
    void show() const {
        printf("PrivateChild: pub=%d prot=%d\n", pub, prot);
    }
};

int main() {
    PublicChild pc(1, 2, 3);
    pc.show();
    printf("pub direct: %d\n", pc.pub); // OK - public inheritance
    pc.info();

    ProtectedChild ptc(4, 5, 6);
    ptc.show();
    // ptc.pub; // Error - protected inheritance makes pub protected
    printf("priv via using: %d\n", ptc.get_priv());

    PrivateChild prc(7, 8, 9);
    prc.show();
    // prc.pub; // Error - private inheritance

    return 0;
}
