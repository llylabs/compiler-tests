// toml++ v3.4.0 — single-header TOML parser.
// Heavy template + std::variant + Unicode + UTF-8 path coverage.
#define TOML_HEADER_ONLY 1
#define TOML_EXCEPTIONS 1
#include "toml.hpp"
#include <cstdio>
#include <sstream>
#include <string>

int main() {
    static constexpr std::string_view src = R"(
[server]
host = "wasm.local"
port = 8080
features = ["a", "b", "c"]

[[items]]
name = "alpha"
weight = 1.5

[[items]]
name = "beta"
weight = 2.25
)";

    try {
        auto tbl = toml::parse(src);
        const auto host = tbl["server"]["host"].value_or<std::string>("");
        const auto port = tbl["server"]["port"].value_or<int>(0);
        const auto features = tbl["server"]["features"].as_array();
        std::printf("host=%s\n", host.c_str());
        std::printf("port=%d\n", port);
        std::printf("nfeat=%zu\n", features ? features->size() : 0);

        const auto items = tbl["items"].as_array();
        if (items && items->size() == 2) {
            auto t0 = items->get(0)->as_table();
            auto t1 = items->get(1)->as_table();
            std::printf("item0=%s w=%.2f\n",
                (*t0)["name"].value_or<std::string>("").c_str(),
                (*t0)["weight"].value_or<double>(0.0));
            std::printf("item1=%s w=%.2f\n",
                (*t1)["name"].value_or<std::string>("").c_str(),
                (*t1)["weight"].value_or<double>(0.0));
        }
        std::printf("toml++:OK\n");
    } catch (const toml::parse_error& e) {
        std::printf("toml++:FAIL %s\n", e.description().data());
    }
    std::fflush(stdout);
    return 0;
}
