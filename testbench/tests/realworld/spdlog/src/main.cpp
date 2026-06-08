// spdlog 1.14 header-only smoke test for NEX C++ pipeline.
// Exercises: console sink, format strings, log levels, basic_logger, fmt-bridge.
//
// spdlog vendors fmt internally under spdlog/fmt/bundled/ and uses it via
// SPDLOG_FMT_EXTERNAL=undef (default, header-only). All output goes through
// stdout via a manually-instantiated sink to keep WASI/printf-only happy.

// Skip spdlog/spdlog.h — it pulls details/registry.h → details/periodic_worker.h
// which unconditionally includes <thread>; WASI libc++ has no threads.
// Include only what we need: logger + ostream sink + pattern_formatter.
#define SPDLOG_HEADER_ONLY
#define SPDLOG_DISABLE_DEFAULT_LOGGER
#define SPDLOG_NO_THREAD_ID
#define SPDLOG_NO_TLS
#define SPDLOG_NO_ATOMIC_LEVELS

// Provide std::mutex / std::lock_guard / std::thread::id stubs first; libc++
// in WASI no-threads mode #ifdefs these out, but spdlog references them
// unconditionally even with the no-threads macros above.
#include "nex_threading_stub.h"

#include "spdlog/logger.h"
#include "spdlog/sinks/ostream_sink.h"
#include "spdlog/pattern_formatter.h"

#include <cstdio>
#include <sstream>
#include <string>

// Provide getpid stub: WASI lacks process identifiers and spdlog's os::pid()
// references ::getpid() unconditionally on non-Windows.
extern "C" int getpid(void) { return 1; }

int main() {
    std::printf("== spdlog smoke ==\n");

    // 1) Format-string with positional + named args via fmt-bundled.
    {
        std::ostringstream oss;
        auto sink = std::make_shared<spdlog::sinks::ostream_sink_mt>(oss);
        spdlog::logger logger("t1", sink);
        logger.set_pattern("%v");
        logger.set_level(spdlog::level::trace);
        logger.info("s1:hello {}, ans={}", "world", 42);
        std::printf("%s", oss.str().c_str());
    }

    // 2) Multiple log levels filtered through level setter.
    {
        std::ostringstream oss;
        auto sink = std::make_shared<spdlog::sinks::ostream_sink_mt>(oss);
        spdlog::logger logger("t2", sink);
        logger.set_pattern("[%l] %v");
        logger.set_level(spdlog::level::warn);
        logger.debug("must-not-appear");
        logger.info("must-not-appear");
        logger.warn("s2:warned");
        logger.error("s3:errored");
        std::printf("%s", oss.str().c_str());
    }

    // 3) Floating point + width formatting via fmt syntax.
    {
        std::ostringstream oss;
        auto sink = std::make_shared<spdlog::sinks::ostream_sink_mt>(oss);
        spdlog::logger logger("t3", sink);
        logger.set_pattern("%v");
        logger.info("s4:pi={:.3f} hex={:#x} pad=[{:>5}]", 3.14159, 255, 7);
        std::printf("%s", oss.str().c_str());
    }

    // 4) Logger name + custom pattern (verifies pattern_formatter parsing).
    {
        std::ostringstream oss;
        auto sink = std::make_shared<spdlog::sinks::ostream_sink_mt>(oss);
        spdlog::logger logger("named", sink);
        logger.set_pattern("[%n][%l] %v");
        logger.info("s5:msg");
        std::printf("%s", oss.str().c_str());
    }

    std::printf("OK\n");
    std::fflush(stdout);
    return 0;
}
