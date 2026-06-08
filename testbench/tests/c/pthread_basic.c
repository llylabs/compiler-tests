/* M6 DoD: pthread_create + pthread_join. Worker liefert 42 als void*,
 * Main thread harvested den Wert. */
#include <stdio.h>
#include <pthread.h>

static void *worker(void *arg) {
    (void)arg;
    return (void *)42L;
}

int main(void) {
    pthread_t t;
    int cr = pthread_create(&t, NULL, worker, NULL);
    if (cr != 0) {
        printf("create_failed=%d\n", cr);
        return 0;
    }
    void *r = NULL;
    pthread_join(t, &r);
    printf("result=%ld\n", (long)r);
    return 0;
}
