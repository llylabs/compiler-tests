// Minimal threading-primitive stubs for libraries that pull <mutex>/<thread>
// unconditionally on WASI no-threads. We never actually run more than one
// thread here, so all locks/mutexes are no-ops. Only the type names matter.
//
// Must be included BEFORE the library headers that reference std::mutex /
// std::lock_guard / std::thread::id.

#ifndef NEX_THREADING_STUB_H
#define NEX_THREADING_STUB_H

#include <cstddef>
#include <functional>
#include <chrono>

namespace std {

class mutex {
public:
    mutex() noexcept = default;
    ~mutex() = default;
    mutex(const mutex&) = delete;
    mutex& operator=(const mutex&) = delete;
    void lock() noexcept {}
    bool try_lock() noexcept { return true; }
    void unlock() noexcept {}
};

class recursive_mutex {
public:
    recursive_mutex() noexcept = default;
    ~recursive_mutex() = default;
    recursive_mutex(const recursive_mutex&) = delete;
    recursive_mutex& operator=(const recursive_mutex&) = delete;
    void lock() noexcept {}
    bool try_lock() noexcept { return true; }
    void unlock() noexcept {}
};

template <typename Mutex>
class lock_guard {
public:
    explicit lock_guard(Mutex&) noexcept {}
    ~lock_guard() = default;
    lock_guard(const lock_guard&) = delete;
    lock_guard& operator=(const lock_guard&) = delete;
};

template <typename Mutex>
class unique_lock {
public:
    unique_lock() noexcept = default;
    explicit unique_lock(Mutex&) noexcept {}
    ~unique_lock() = default;
    unique_lock(const unique_lock&) = delete;
    unique_lock& operator=(const unique_lock&) = delete;
    void lock() noexcept {}
    bool try_lock() noexcept { return true; }
    void unlock() noexcept {}
};

struct thread_id {
    thread_id() noexcept = default;
    bool operator==(const thread_id&) const noexcept { return true; }
    bool operator!=(const thread_id&) const noexcept { return false; }
};

class thread {
public:
    using id = thread_id;
    thread() noexcept = default;
    static unsigned int hardware_concurrency() noexcept { return 1; }
};

namespace this_thread {
inline thread_id get_id() noexcept { return thread_id{}; }
template <typename Duration>
inline void sleep_for(const Duration&) noexcept {}
}

template <> struct hash<thread_id> {
    size_t operator()(const thread_id&) const noexcept { return 0; }
};

} // namespace std

#endif // NEX_THREADING_STUB_H
