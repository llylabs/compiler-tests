// Driver for nlohmann/json — parse, access, roundtrip.
#include "json.hpp"
#include <iostream>
#include <string>

using nlohmann::json;

int main() {
    const std::string text = R"({
        "name": "Alice",
        "age": 30,
        "tags": ["c++", "wasm", "prod"],
        "nested": {"x": 1, "y": 2}
    })";

    json j;
    try {
        j = json::parse(text);
    } catch (const json::exception& e) {
        std::cout << "parse:FAIL " << e.what() << "\n";
        return 1;
    }
    std::cout << "parse:OK\n";

    std::cout << "name:" << j["name"].get<std::string>() << "\n";
    std::cout << "age:"  << j["age"].get<int>() << "\n";

    std::cout << "tags:";
    bool first = true;
    for (const auto& t : j["tags"]) {
        if (!first) std::cout << ",";
        std::cout << t.get<std::string>();
        first = false;
    }
    std::cout << "\n";

    std::cout << "nested.x:" << j["nested"]["x"].get<int>() << "\n";
    std::cout << "nested.y:" << j["nested"]["y"].get<int>() << "\n";

    // Roundtrip: serialize and re-parse
    std::string dumped = j.dump();
    json j2;
    try {
        j2 = json::parse(dumped);
    } catch (...) {
        std::cout << "roundtrip:FAIL\n";
        return 1;
    }
    if (j2 == j) std::cout << "roundtrip:OK\n";
    else         std::cout << "roundtrip:MISMATCH\n";

    std::cout << "OK\n";
    return 0;
}
