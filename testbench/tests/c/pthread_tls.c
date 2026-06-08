/* M6 DoD: TLS pro Thread, kein Crosstalk.
 * Worker A schreibt "A" und liest es zurück, Worker B "B".
 * Main-Thread hat selbst nie setspecific aufgerufen → muss NULL lesen. */
#include <stdio.h>
#include <pthread.h>

static pthread_key_t key;
static char buf_a[] = "A";
static char buf_b[] = "B";

static void *thread_fn(void *arg) {
    pthread_setspecific(key, arg);
    return pthread_getspecific(key);
}

int main(void) {
    pthread_key_create(&key, NULL);

    pthread_t t1, t2;
    if (pthread_create(&t1, NULL, thread_fn, buf_a) != 0) { printf("create_failed\n"); return 0; }
    if (pthread_create(&t2, NULL, thread_fn, buf_b) != 0) { printf("create_failed\n"); return 0; }

    void *r1 = NULL, *r2 = NULL;
    pthread_join(t1, &r1);
    pthread_join(t2, &r2);

    void *main_slot = pthread_getspecific(key);

    printf("thread1=%s thread2=%s main_slot_null=%d\n",
           (char *)r1, (char *)r2, main_slot == NULL);

    pthread_key_delete(key);
    return 0;
}
