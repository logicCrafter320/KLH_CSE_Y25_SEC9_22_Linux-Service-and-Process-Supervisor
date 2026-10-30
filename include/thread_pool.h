#ifndef THREAD_POOL_H
#define THREAD_POOL_H
#include "supervisor.h"
ThreadPool *tp_create(int num_threads);
void tp_destroy(ThreadPool *pool);
int tp_submit(ThreadPool *pool, void (*function)(void*), void *arg);
void tp_wait_all(ThreadPool *pool);
void tp_demo_race_condition(void);
void tp_demo_producer_consumer(void);
void tp_demo_semaphore(void);
void tp_demo_deadlock_avoidance(void);
#endif
