#include "thread_pool.h"
#include "logger.h"

static void *tp_worker(void *arg) {
    ThreadPool *pool = (ThreadPool *)arg;
    while (1) {
        sem_wait(&pool->task_semaphore);
        if (pool->shutdown) break;
        pthread_mutex_lock(&pool->queue_mutex);
        Task *task = pool->task_queue_head;
        if (task) {
            pool->task_queue_head = task->next;
            if (!pool->task_queue_head) pool->task_queue_tail = NULL;
        }
        pthread_mutex_unlock(&pool->queue_mutex);
        if (task) {
            task->function(task->arg);
            free(task);
            pthread_mutex_lock(&pool->active_mutex);
            pool->active_tasks--;
            if (pool->active_tasks == 0) pthread_cond_signal(&pool->active_cond);
            pthread_mutex_unlock(&pool->active_mutex);
        }
    }
    return NULL;
}

ThreadPool *tp_create(int num_threads) {
    ThreadPool *pool = calloc(1, sizeof(ThreadPool));
    if (!pool) return NULL;
    pool->shutdown = 0; pool->active_tasks = 0;
    pthread_mutex_init(&pool->queue_mutex, NULL);
    pthread_cond_init(&pool->queue_cond, NULL);
    pthread_mutex_init(&pool->active_mutex, NULL);
    pthread_cond_init(&pool->active_cond, NULL);
    sem_init(&pool->task_semaphore, 0, 0);
    int n = num_threads < THREAD_POOL_SIZE ? num_threads : THREAD_POOL_SIZE;
    for (int i = 0; i < n; i++)
        pthread_create(&pool->threads[i], NULL, tp_worker, pool);
    log_event("CO-6: Thread pool created (%d workers)", n);
    return pool;
}

void tp_destroy(ThreadPool *pool) {
    if (!pool) return;
    pool->shutdown = 1;
    for (int i = 0; i < THREAD_POOL_SIZE; i++) sem_post(&pool->task_semaphore);
    for (int i = 0; i < THREAD_POOL_SIZE; i++) pthread_join(pool->threads[i], NULL);
    Task *t = pool->task_queue_head;
    while (t) { Task *n = t->next; free(t); t = n; }
    pthread_mutex_destroy(&pool->queue_mutex);
    pthread_cond_destroy(&pool->queue_cond);
    pthread_mutex_destroy(&pool->active_mutex);
    pthread_cond_destroy(&pool->active_cond);
    sem_destroy(&pool->task_semaphore);
    free(pool);
    log_event("CO-6: Thread pool destroyed");
}

int tp_submit(ThreadPool *pool, void (*function)(void*), void *arg) {
    Task *task = malloc(sizeof(Task));
    if (!task) return -1;
    task->function = function; task->arg = arg; task->next = NULL;
    pthread_mutex_lock(&pool->queue_mutex);
    if (pool->task_queue_tail) pool->task_queue_tail->next = task;
    else pool->task_queue_head = task;
    pool->task_queue_tail = task;
    pthread_mutex_lock(&pool->active_mutex);
    pool->active_tasks++;
    pthread_mutex_unlock(&pool->active_mutex);
    pthread_mutex_unlock(&pool->queue_mutex);
    sem_post(&pool->task_semaphore);
    return 0;
}

void tp_wait_all(ThreadPool *pool) {
    pthread_mutex_lock(&pool->active_mutex);
    while (pool->active_tasks > 0)
        pthread_cond_wait(&pool->active_cond, &pool->active_mutex);
    pthread_mutex_unlock(&pool->active_mutex);
}

static int g_counter = 0;
static pthread_mutex_t g_cmtx = PTHREAD_MUTEX_INITIALIZER;

static void *race_inc(void *a) {
    (void)a;
    for (int i = 0; i < 100000; i++) g_counter++;
    return NULL;
}

static void *safe_inc(void *a) {
    (void)a;
    for (int i = 0; i < 100000; i++) {
        pthread_mutex_lock(&g_cmtx); g_counter++; pthread_mutex_unlock(&g_cmtx);
    }
    return NULL;
}

void tp_demo_race_condition(void) {
    printf("\n  === CO-6: RACE CONDITION DEMO ===\n\n");
    pthread_t th[4];
    g_counter = 0;
    printf("  4 threads x 100000 increments. Expected: 400000\n");
    for (int i = 0; i < 4; i++) pthread_create(&th[i], NULL, race_inc, NULL);
    for (int i = 0; i < 4; i++) pthread_join(th[i], NULL);
    printf("  Without mutex: %d (WRONG - race condition!)\n", g_counter);
    g_counter = 0;
    for (int i = 0; i < 4; i++) pthread_create(&th[i], NULL, safe_inc, NULL);
    for (int i = 0; i < 4; i++) pthread_join(th[i], NULL);
    printf("  With mutex:    %d (CORRECT)\n\n", g_counter);
    printf("  counter++ is NOT atomic: read->modify->write can interleave.\n\n");
    log_event("CO-6: Race condition demo done");
}

#define BBUF_SZ 5
typedef struct {
    int buf[BBUF_SZ], count, in, out, done;
    pthread_mutex_t mtx;
    pthread_cond_t not_empty, not_full;
} BBuf;

static void *prod(void *a) {
    BBuf *b = (BBuf*)a;
    for (int i = 1; i <= 10; i++) {
        pthread_mutex_lock(&b->mtx);
        while (b->count == BBUF_SZ) pthread_cond_wait(&b->not_full, &b->mtx);
        b->buf[b->in] = i; b->in = (b->in+1) % BBUF_SZ; b->count++;
        printf("  [PROD] Produced %d (buf: %d/%d)\n", i, b->count, BBUF_SZ);
        pthread_cond_signal(&b->not_empty);
        pthread_mutex_unlock(&b->mtx);
        usleep(80000);
    }
    pthread_mutex_lock(&b->mtx); b->done = 1;
    pthread_cond_signal(&b->not_empty); pthread_mutex_unlock(&b->mtx);
    return NULL;
}

static void *cons(void *a) {
    BBuf *b = (BBuf*)a;
    while (1) {
        pthread_mutex_lock(&b->mtx);
        while (b->count == 0 && !b->done) pthread_cond_wait(&b->not_empty, &b->mtx);
        if (b->count == 0 && b->done) { pthread_mutex_unlock(&b->mtx); break; }
        int item = b->buf[b->out]; b->out = (b->out+1) % BBUF_SZ; b->count--;
        printf("  [CONS] Consumed %d (buf: %d/%d)\n", item, b->count, BBUF_SZ);
        pthread_cond_signal(&b->not_full);
        pthread_mutex_unlock(&b->mtx);
        usleep(150000);
    }
    return NULL;
}

void tp_demo_producer_consumer(void) {
    printf("\n  === CO-6: PRODUCER-CONSUMER (Bounded Buffer) ===\n\n");
    BBuf b; memset(&b, 0, sizeof(b));
    pthread_mutex_init(&b.mtx, NULL);
    pthread_cond_init(&b.not_empty, NULL);
    pthread_cond_init(&b.not_full, NULL);
    pthread_t p, c;
    pthread_create(&p, NULL, prod, &b);
    pthread_create(&c, NULL, cons, &b);
    pthread_join(p, NULL); pthread_join(c, NULL);
    pthread_mutex_destroy(&b.mtx);
    pthread_cond_destroy(&b.not_empty);
    pthread_cond_destroy(&b.not_full);
    printf("\n  Mutex + condition variables coordinate producer/consumer.\n\n");
    log_event("CO-6: Producer-consumer demo done");
}

static sem_t g_rsem;
static void *sem_w(void *a) {
    int id = *(int*)a;
    printf("  [T%d] Waiting...\n", id);
    sem_wait(&g_rsem);
    printf("  [T%d] Got resource! Working...\n", id);
    usleep(400000);
    printf("  [T%d] Releasing.\n", id);
    sem_post(&g_rsem);
    return NULL;
}

void tp_demo_semaphore(void) {
    printf("\n  === CO-6: COUNTING SEMAPHORE DEMO ===\n\n");
    printf("  5 threads, 2 resource slots:\n\n");
    sem_init(&g_rsem, 0, 2);
    pthread_t th[5]; int ids[5] = {1,2,3,4,5};
    for (int i = 0; i < 5; i++) { pthread_create(&th[i], NULL, sem_w, &ids[i]); usleep(30000); }
    for (int i = 0; i < 5; i++) pthread_join(th[i], NULL);
    sem_destroy(&g_rsem);
    printf("\n  Only 2 threads held the resource at any time.\n\n");
    log_event("CO-6: Semaphore demo done");
}

void tp_demo_deadlock_avoidance(void) {
    printf("\n  === CO-6: DEADLOCK AVOIDANCE ===\n\n");
    printf("  4 Conditions for deadlock:\n");
    printf("    1. Mutual Exclusion    2. Hold and Wait\n");
    printf("    3. No Preemption       4. Circular Wait\n\n");
    printf("  DEADLOCK:  T1: lock(A),lock(B)  T2: lock(B),lock(A)\n");
    printf("  SOLUTION:  T1: lock(A),lock(B)  T2: lock(A),lock(B) (same order!)\n\n");
    pthread_mutex_t la = PTHREAD_MUTEX_INITIALIZER, lb = PTHREAD_MUTEX_INITIALIZER;
    pthread_mutex_lock(&la);
    printf("  Acquired Lock A. Trying Lock B with trylock()...\n");
    if (pthread_mutex_trylock(&lb) == 0) {
        printf("  Got Lock B (no deadlock). Releasing both.\n");
        pthread_mutex_unlock(&lb);
    } else {
        printf("  Lock B busy — backing off to avoid deadlock.\n");
    }
    pthread_mutex_unlock(&la);
    pthread_mutex_destroy(&la); pthread_mutex_destroy(&lb);
    printf("\n  Strategies: lock ordering, trylock, timeouts.\n\n");
    log_event("CO-6: Deadlock avoidance demo done");
}
