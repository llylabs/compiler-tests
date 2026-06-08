// doctest v2.4.11 - alternative single-header test framework.
// Exercises macro/template/EH machinery similar to but distinct from Catch2.
//
// NOTE: doctest unconditionally `#include <csignal>` inside its impl block,
// even on platforms where it disables POSIX signal handling. wasi-sysroot
// signal.h is a hard #error unless `_WASI_EMULATED_SIGNAL` is defined.
// Defining it just opens the header — no signal() calls are emitted on
// wasi (DOCTEST_CONFIG_POSIX_SIGNALS is auto-undef'd for __wasi__).
#define _WASI_EMULATED_SIGNAL
#define DOCTEST_CONFIG_IMPLEMENT
#include "doctest.h"

#include <cstdio>
#include <stdexcept>
#include <vector>

TEST_CASE("vector basics") {
    std::vector<int> v;
    CHECK(v.empty());
    v.push_back(1);
    v.push_back(2);
    v.push_back(3);
    CHECK(v.size() == 3);
    CHECK(v.front() == 1);
    CHECK(v.back() == 3);
}

TEST_CASE("approx + throws") {
    CHECK(0.1 + 0.2 == doctest::Approx(0.3));
    CHECK_THROWS_AS(
        []() { throw std::runtime_error("boom"); }(),
        std::runtime_error);
}

TEST_CASE("subcase fan-out") {
    int x = 0;
    SUBCASE("a") { x = 1; CHECK(x == 1); }
    SUBCASE("b") { x = 2; CHECK(x == 2); }
}

int main(int argc, char** argv) {
    doctest::Context ctx;
    ctx.applyCommandLine(argc, argv);
    int rc = ctx.run();
    if (ctx.shouldExit()) return rc;
    if (rc == 0) std::printf("doctest:OK\n");
    else         std::printf("doctest:FAIL rc=%d\n", rc);
    std::fflush(stdout);
    return rc;
}
