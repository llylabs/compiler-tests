// abseil-cpp 20240722.0 strings smoke test for NEX C++ pipeline.
// Exercises: StrCat (variadic format), StrSplit, StrJoin, SimpleAtoi,
// StartsWith/EndsWith/EqualsIgnoreCase, AsciiStrToUpper.
//
// abseil internally throws std::bad_alloc on allocation failure and uses
// std::logic_error from throw_delegate.cc; together with raw_logging,
// int128, and memutil this exercises a substantial real-world C++ TU.
//
// Build is via unity-include of the .cc files listed in program.json
// (testbench wraps each source with #include "<src>" inside wrapper.cpp).
#include "absl/strings/str_cat.h"
#include "absl/strings/str_split.h"
#include "absl/strings/str_join.h"
#include "absl/strings/string_view.h"
#include "absl/strings/numbers.h"
#include "absl/strings/match.h"
#include "absl/strings/ascii.h"

#include <cstdio>
#include <vector>
#include <string>

int main() {
    std::string s = absl::StrCat("hello, ", "world ", 42, " ", 3.14);
    std::printf("strcat=%s\n", s.c_str());

    std::vector<std::string> parts = absl::StrSplit("a,b,c,d,e", ',');
    std::printf("split.n=%zu first=%s last=%s\n",
                parts.size(), parts.front().c_str(), parts.back().c_str());

    std::string joined = absl::StrJoin(parts, "|");
    std::printf("join=%s\n", joined.c_str());

    int v = 0;
    if (absl::SimpleAtoi("12345", &v)) std::printf("atoi=%d\n", v);

    std::printf("starts=%d ends=%d ic=%d\n",
                absl::StartsWith("hello", "he"),
                absl::EndsWith("hello", "lo"),
                absl::EqualsIgnoreCase("HELLO", "hello"));

    std::printf("upper=%s\n", absl::AsciiStrToUpper("HelloWorld").c_str());

    std::printf("abseil-strings:OK\n");
    return 0;
}
