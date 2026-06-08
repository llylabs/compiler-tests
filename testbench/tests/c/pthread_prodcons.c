/* M6 DoD: Producer/Consumer mit Mutex+Condvar.
 * Im kooperativen Modell läuft producer komplett durch, BEVOR pthread_create
 * zurückkehrt — d.h. consumer sieht einen vollen Buffer. Mutex schützt
 * gegen Logikfehler, nicht gegen echte Races (gibt's hier nicht). */
#include <stdio.h>
#include <pthread.h>

#define BUF_SIZE 1024
static int buffer[BUF_SIZE];
static int head = 0, tail = 0, count = 0;
static pthread_mutex_t mtx = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t cv = PTHREAD_COND_INITIALIZER;

static void *producer(void *arg) {
    (void)arg;
    for (int i = 0; i < 1000; ++i) {
        pthread_mutex_lock(&mtx);
        if (count < BUF_SIZE) {
            buffer[head] = i;
            head = (head + 1) % BUF_SIZE;
            count++;
            pthread_cond_signal(&cv);
        }
        pthread_mutex_unlock(&mtx);
    }
    return (void *)1000L;
}

static void *consumer(void *arg) {
    (void)arg;
    long got = 0;
    long sum = 0;
    while (got < 1000) {
        pthread_mutex_lock(&mtx);
        if (count == 0) {
            pthread_mutex_unlock(&mtx);
            break;
        }
        sum += buffer[tail];
        tail = (tail + 1) % BUF_SIZE;
        count--;
        got++;
        pthread_mutex_unlock(&mtx);
    }
    return (void *)sum;
}

int main(void) {
    pthread_t p, c;
    if (pthread_create(&p, NULL, producer, NULL) != 0) { printf("create_failed\n"); return 0; }
    if (pthread_create(&c, NULL, consumer, NULL) != 0) { printf("create_failed\n"); return 0; }

    void *prod_res = NULL, *cons_res = NULL;
    pthread_join(p, &prod_res);
    pthread_join(c, &cons_res);

    printf("produced=%ld remaining=%ld sum=%ld\n",
           (long)prod_res, (long)count, (long)cons_res);
    return 0;
}
