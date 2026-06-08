// simdjson 3.10.1 smoke test.
//
// Parses an embedded JSON document via the on-demand API and prints the
// extracted fields to stdout. simdjson auto-selects an implementation at
// runtime; on wasm32 (no SIMD), the "fallback" generic-C++ kernel is used.
//
// The amalgamated simdjson.cpp is included via `sources` in program.json,
// so simdjson::ondemand::parser etc. are visible here.
#include <cstdio>
#include <string>

// simdjson.h is pulled in transitively via singleheader/simdjson.cpp, but
// include it again (header guards keep this idempotent) so the driver is
// self-contained for IDEs / clangd.
#include "simdjson.h"

static const char* JSON_INPUT = R"({
    "name": "Alice",
    "age": 30,
    "tags": ["cpp", "wasm", "prod"],
    "nested": { "x": 1, "y": 2 },
    "items": [10, 20, 30]
})";

int main() {
    // padded_string requires SIMDJSON_PADDING bytes of trailing slack; the
    // ctor handles that.
    std::string input(JSON_INPUT);
    simdjson::padded_string padded(input);

    simdjson::ondemand::parser parser;
    simdjson::ondemand::document doc;
    auto err = parser.iterate(padded).get(doc);
    if (err) {
        std::printf("FAIL: iterate err=%s\n", simdjson::error_message(err));
        return 1;
    }

    std::string_view name;
    if (doc["name"].get(name)) { std::printf("FAIL: name\n"); return 1; }
    std::printf("name=%.*s\n", (int)name.size(), name.data());

    int64_t age;
    if (doc["age"].get(age)) { std::printf("FAIL: age\n"); return 1; }
    std::printf("age=%lld\n", (long long)age);

    int idx = 0;
    for (auto tag_result : doc["tags"]) {
        std::string_view tag;
        if (tag_result.get(tag)) { std::printf("FAIL: tags[%d]\n", idx); return 1; }
        std::printf("tags[%d]=%.*s\n", idx, (int)tag.size(), tag.data());
        ++idx;
    }

    int64_t nx, ny;
    if (doc["nested"]["x"].get(nx)) { std::printf("FAIL: nested.x\n"); return 1; }
    if (doc["nested"]["y"].get(ny)) { std::printf("FAIL: nested.y\n"); return 1; }
    std::printf("nested.x=%lld\n", (long long)nx);
    std::printf("nested.y=%lld\n", (long long)ny);

    int item_count = 0;
    for (auto item : doc["items"]) {
        int64_t v;
        if (item.get(v)) { std::printf("FAIL: items[%d]\n", item_count); return 1; }
        ++item_count;
    }
    std::printf("items=%d\n", item_count);

    std::printf("OK\n");
    return 0;
}
