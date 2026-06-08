#include <stdio.h>

static int resource_count = 0;

struct Resource {
    int id;
    bool owned;
    Resource(int i) : id(i), owned(true) {
        resource_count++;
        printf("acquire %d (total=%d)\n", id, resource_count);
    }
    Resource(const Resource &o) : id(o.id + 100), owned(true) {
        resource_count++;
        printf("copy %d (total=%d)\n", id, resource_count);
    }
    Resource(Resource &&o) : id(o.id), owned(true) {
        o.owned = false;
        printf("move %d\n", id);
    }
    ~Resource() {
        if (owned) {
            resource_count--;
            printf("release %d (total=%d)\n", id, resource_count);
        } else {
            printf("skip release %d (moved)\n", id);
        }
    }
};

// Scope guard pattern
struct ScopeGuard {
    const char *msg;
    bool active;
    ScopeGuard(const char *m) : msg(m), active(true) {}
    ~ScopeGuard() {
        if (active) printf("guard: %s\n", msg);
    }
    void dismiss() { active = false; }
};

// RAII with exception
void may_fail(bool fail) {
    Resource r1(10);
    ScopeGuard g("cleanup");
    Resource r2(20);

    if (fail) {
        printf("about to throw\n");
        throw 42;
    }

    g.dismiss();
    printf("success path\n");
}

// Nested RAII scopes
void nested_raii() {
    Resource outer(1);
    {
        Resource mid(2);
        {
            Resource inner(3);
        }
        // inner released, mid still alive
        printf("after inner: total=%d\n", resource_count);
    }
    // mid released, outer still alive
    printf("after mid: total=%d\n", resource_count);
}

// Return RAII object (move/RVO)
Resource make_resource(int id) {
    Resource r(id);
    return r;
}

int main() {
    printf("--- nested ---\n");
    nested_raii();
    printf("total=%d\n", resource_count);

    printf("--- exception success ---\n");
    try { may_fail(false); } catch (...) {}
    printf("total=%d\n", resource_count);

    printf("--- exception fail ---\n");
    try { may_fail(true); } catch (int e) {
        printf("caught %d total=%d\n", e, resource_count);
    }

    printf("--- factory ---\n");
    {
        Resource r = make_resource(50);
        printf("made: id=%d\n", r.id);
    }
    printf("final total=%d\n", resource_count);

    return 0;
}
