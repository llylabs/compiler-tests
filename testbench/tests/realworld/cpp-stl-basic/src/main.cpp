// Smoke test: validates libc++ baseline (vector, string, map, iostream, EH)
#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <algorithm>
#include <stdexcept>
#include <memory>

struct Item {
    std::string name;
    int qty;
};

int main() {
    // 1. vector + sort
    std::vector<int> v = {5, 2, 8, 1, 9, 3};
    std::sort(v.begin(), v.end());
    std::cout << "sorted:";
    for (int x : v) std::cout << " " << x;
    std::cout << "\n";

    // 2. string concat + find
    std::string s = "hello";
    s += ", ";
    s += "world";
    std::cout << "string=" << s << " len=" << s.size() << "\n";
    auto pos = s.find("world");
    std::cout << "find=" << (pos == std::string::npos ? -1 : (int)pos) << "\n";

    // 3. map<string,int>
    std::map<std::string, int> m;
    m["alpha"] = 1;
    m["beta"]  = 2;
    m["gamma"] = 3;
    for (const auto& kv : m) {
        std::cout << "kv:" << kv.first << "=" << kv.second << "\n";
    }

    // 4. unique_ptr + struct
    auto it = std::make_unique<Item>(Item{"widget", 42});
    std::cout << "ptr:" << it->name << "/" << it->qty << "\n";

    // 5. exceptions
    try {
        throw std::runtime_error("boom");
    } catch (const std::exception& e) {
        std::cout << "caught:" << e.what() << "\n";
    }

    // 6. vector<string> + transform
    std::vector<std::string> words = {"foo", "bar", "baz"};
    std::vector<size_t> lens;
    std::transform(words.begin(), words.end(), std::back_inserter(lens),
                   [](const std::string& w) { return w.size(); });
    std::cout << "lens:";
    for (auto l : lens) std::cout << " " << l;
    std::cout << "\n";

    std::cout << "OK\n";
    return 0;
}
