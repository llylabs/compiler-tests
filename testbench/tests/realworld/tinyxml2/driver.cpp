// Driver for tinyxml2 — parse a small XML doc and walk it.
#include <cstdio>
#include <cstring>

using namespace tinyxml2;

static const char* kXml =
    "<?xml version=\"1.0\"?>"
    "<catalog>"
    "  <book id=\"1\">"
    "    <title>Effective C++</title>"
    "    <author>Scott Meyers</author>"
    "    <price>39.99</price>"
    "  </book>"
    "</catalog>";

int main() {
    XMLDocument doc;
    XMLError err = doc.Parse(kXml);
    if (err != XML_SUCCESS) {
        std::printf("parse:FAIL err=%d\n", (int)err);
        return 1;
    }
    std::printf("parse:OK\n");

    XMLElement* root = doc.RootElement();
    if (!root) { std::printf("no root\n"); return 1; }
    std::printf("root:%s\n", root->Name());

    XMLElement* book = root->FirstChildElement("book");
    if (!book) { std::printf("no book\n"); return 1; }
    std::printf("child:%s\n", book->Name());

    if (auto* t = book->FirstChildElement("title"))
        std::printf("title:%s\n", t->GetText());
    if (auto* a = book->FirstChildElement("author"))
        std::printf("author:%s\n", a->GetText());
    if (auto* p = book->FirstChildElement("price"))
        std::printf("price:%s\n", p->GetText());

    std::printf("OK\n");
    return 0;
}
