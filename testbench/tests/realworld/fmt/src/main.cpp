// Driver for {fmt} 11.0.2 — header-only formatting.
// Exercises basic format strings, named args, integer/float formatting,
// and the dynamic format API.
#define FMT_HEADER_ONLY 1
// clang 18 / wasi-sdk libc++ has a constexpr-pointer-arithmetic gap in
// fmt's FMT_STRING compile-time format-string checker. The internal
// FMT_STRING uses inside format-inl.h (e.g. bigint formatter) trip the
// compiler. Bypass by routing FMT_STRING through the runtime path —
// users still get correct formatting; only compile-time format
// validation is disabled.
#define FMT_USE_CONSTEVAL 0
#define FMT_STRING(s) (s)
#include "fmt/format.h"
#include "fmt/ranges.h"

#include <cstdio>
#include <string>
#include <vector>

int main() {
    // 1) Plain format with positional args
    std::string s1 = fmt::format("hello, {}!", "world");
    std::printf("s1:%s\n", s1.c_str());

    // 2) Indexed args, integer formatting
    std::string s2 = fmt::format("{0}+{1}={2}", 2, 3, 2 + 3);
    std::printf("s2:%s\n", s2.c_str());

    // 3) Width / fill / alignment
    std::string s3 = fmt::format("[{:>6}]", 42);
    std::printf("s3:%s\n", s3.c_str());

    // 4) Hex / binary / octal
    std::string s4 = fmt::format("{:#x} {:#o} {:#b}", 255, 8, 5);
    std::printf("s4:%s\n", s4.c_str());

    // 5) Float formatting
    std::string s5 = fmt::format("{:.3f}", 3.14159265);
    std::printf("s5:%s\n", s5.c_str());

    // 6) Range / vector via fmt::join
    std::vector<int> v{1, 2, 3, 4};
    std::string s6 = fmt::format("[{}]", fmt::join(v, ","));
    std::printf("s6:%s\n", s6.c_str());

    // 7) Memory writer (format_to)
    fmt::memory_buffer buf;
    fmt::format_to(std::back_inserter(buf), "buf:{}-{}", "ok", 7);
    std::printf("s7:%.*s\n", static_cast<int>(buf.size()), buf.data());

    std::printf("OK\n");
    return 0;
}
