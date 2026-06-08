// magic_enum v0.9.5 — header-only enum-to-string via __PRETTY_FUNCTION__ trick.
// Stress-tests constexpr evaluation, template instantiation depth, and
// __builtin_strlen / structured bindings paths.
#include "magic_enum.hpp"
#include <cstdio>
#include <string_view>

enum class Color { Red, Green, Blue, Cyan = 42 };

int main() {
    Color c = Color::Green;

    auto name = magic_enum::enum_name(c);
    std::printf("name=%.*s\n", (int)name.size(), name.data());

    constexpr auto count = magic_enum::enum_count<Color>();
    std::printf("count=%zu\n", count);

    auto parsed = magic_enum::enum_cast<Color>("Blue");
    if (parsed.has_value())
        std::printf("parsed=%d\n", static_cast<int>(parsed.value()));

    auto values = magic_enum::enum_values<Color>();
    std::printf("values=");
    for (size_t i = 0; i < values.size(); ++i)
        std::printf("%s%d", i ? "," : "", static_cast<int>(values[i]));
    std::printf("\n");

    if (name == "Green" && count == 4 && parsed && *parsed == Color::Blue)
        std::printf("magic-enum:OK\n");
    else
        std::printf("magic-enum:FAIL\n");
    std::fflush(stdout);
    return 0;
}
