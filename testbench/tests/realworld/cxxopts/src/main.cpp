// cxxopts v3.2.0 — header-only command-line option parser.
// Exercises std::string, std::vector, std::optional, exception flow,
// and cxxopts' template result-extraction machinery.
#include "cxxopts.hpp"
#include <cstdio>
#include <string>
#include <vector>

int main(int argc, char* argv[]) {
    cxxopts::Options options("cxxopts-smoke", "smoke test for cxxopts");
    options.add_options()
        ("h,help", "show help")
        ("n,name", "your name", cxxopts::value<std::string>()->default_value("world"))
        ("c,count", "iterations", cxxopts::value<int>()->default_value("3"))
        ("v,values", "list", cxxopts::value<std::vector<int>>()->default_value("1,2,3"));

    // Synthesize argv (test runner only passes program name).
    static const char* fake[] = {"prog", "--name", "wasm", "--count", "2", "--values", "10,20"};
    int fake_argc = sizeof(fake) / sizeof(fake[0]);
    auto args = const_cast<char**>(fake);
    auto r = options.parse(fake_argc, args);

    auto name  = r["name"].as<std::string>();
    auto count = r["count"].as<int>();
    auto values = r["values"].as<std::vector<int>>();

    std::printf("name=%s\n", name.c_str());
    std::printf("count=%d\n", count);
    std::printf("values=");
    for (size_t i = 0; i < values.size(); ++i)
        std::printf("%s%d", i ? "," : "", values[i]);
    std::printf("\n");

    if (name == "wasm" && count == 2 && values.size() == 2 && values[0] == 10 && values[1] == 20)
        std::printf("cxxopts:OK\n");
    else
        std::printf("cxxopts:FAIL\n");
    std::fflush(stdout);
    return 0;
}
