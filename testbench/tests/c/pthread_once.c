/* M6 DoD: pthread_once läuft genau einmal, auch über Threads + Main hinweg.
 * 8 Worker rufen jeweils 2x once + Main 2x = 18 Aufrufe → init_count == 1. */
#include <stdio.h>
#include <pthread.h>

static pthread_once_t once = PTHREAD_ONCE_INIT;
static int init_count = 0;

static void init_routine(void) {
    init_count++;
}

static void *worker(void *arg) {
    (void)arg;
    pthread_once(&once, init_routine);
    pthread_once(&once, init_routine);
    return NULL;
}

int main(void) {
    pthread_t threads[8];
    pthread_once(&once, init_routine);
    for (int i = 0; i < 8; ++i)
        if (pthread_create(&threads[i], NULL, worker, NULL) != 0) {
            printf("create_failed\n");
            return 0;
        }
    for (int i = 0; i < 8; ++i)
        pthread_join(threads[i], NULL);
    pthread_once(&once, init_routine);
    printf("init_count=%d\n", init_count);
    return 0;
}
