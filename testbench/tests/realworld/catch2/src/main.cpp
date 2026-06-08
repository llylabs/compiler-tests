// Driver for Catch2 v2.13.10 — single-header unit testing framework.
// Uses CATCH_CONFIG_RUNNER so we own main(): we register two TEST_CASEs
// covering REQUIRE / SECTION / CHECK_THROWS plus floating-point Approx,
// then run the session and print a one-line summary.
#define CATCH_CONFIG_RUNNER
// WASI sysroot ships <signal.h> as a hard #error unless built with
// -D_WASI_EMULATED_SIGNAL. Catch2's POSIX signal handler unconditionally
// pulls in signal.h on non-Windows; tell Catch2 to skip it.
#define CATCH_CONFIG_NO_POSIX_SIGNALS
#include "catch.hpp"

#include <cstdio>
#include <stdexcept>
#include <vector>

TEST_CASE("vector resize and contents", "[vector]") {
    std::vector<int> v;
    REQUIRE(v.empty());

    v.push_back(1);
    v.push_back(2);
    v.push_back(3);
    REQUIRE(v.size() == 3);

    SECTION("front and back") {
        REQUIRE(v.front() == 1);
        REQUIRE(v.back() == 3);
    }

    SECTION("clear empties") {
        v.clear();
        REQUIRE(v.empty());
    }
}

TEST_CASE("approx + throws", "[approx][throws]") {
    REQUIRE(0.1 + 0.2 == Approx(0.3));
    REQUIRE_THROWS_AS(
        []() { throw std::runtime_error("boom"); }(),
        std::runtime_error);
}

int main(int argc, char* argv[]) {
    Catch::Session session;
    int rc = session.run(argc, argv);
    if (rc == 0) {
        std::printf("catch2:OK\n");
    } else {
        std::printf("catch2:FAIL rc=%d\n", rc);
    }
    std::fflush(stdout);
    return rc;
}
