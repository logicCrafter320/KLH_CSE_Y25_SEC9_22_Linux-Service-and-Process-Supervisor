#ifndef SUPERVISOR_H
#define SUPERVISOR_H

#define _GNU_SOURCE

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <sys/mman.h>
#include <sys/resource.h>
#include <signal.h>
#include <fcntl.h>
#include <errno.h>
#include <time.h>
#include <dirent.h>
#include <pthread.h>
#include <semaphore.h>
#include <stdarg.h>
#include <stdint.h>
#include <ctype.h>

#define MAX_PROCESSES       64
#define MAX_CMD_LEN         512
#define MAX_NAME_LEN        128
#define MAX_ARGS            32
#define MAX_LOG_MSG         1024
#define MAX_PATH_LEN        512
#define MONITOR_INTERVAL    2
#define THREAD_POOL_SIZE    4
#define PIPE_BUF_SIZE       4096
#define FIFO_PATH           "/tmp/supervisor_fifo"
#define SHARED_MEM_NAME     "/supervisor_shm"
#define LOG_FILE            "supervisor.log"
#define CONFIG_FILE         "services.conf"

typedef enum {
    STATE_IDLE = 0, STATE_READY, STATE_RUNNING, STATE_PAUSED,
    STATE_STOPPED, STATE_EXITED, STATE_FAILED, STATE_RESTARTING
} ProcessState;

typedef enum { SCHED_FCFS = 0, SCHED_ROUND_ROBIN, SCHED_PRIORITY } SchedPolicy;
typedef enum { IPC_NONE = 0, IPC_PIPE, IPC_FIFO, IPC_SHARED_MEM, IPC_SIGNAL } IPCMethod;

typedef struct {
    int id;
    char name[MAX_NAME_LEN];
    char command[MAX_CMD_LEN];
    pid_t pid;
    ProcessState state;
    int restart_count;
    int intentional_stop;
    int priority;
    time_t start_time;
    time_t end_time;
    unsigned long vm_size_kb;
    unsigned long vm_rss_kb;
    unsigned long vm_shared_kb;
    unsigned long page_faults_minor;
    unsigned long page_faults_major;
    int pipe_fd[2];
    char fifo_path[MAX_PATH_LEN];
    IPCMethod ipc_method;
    int log_fd;
    char log_path[MAX_PATH_LEN];
    int time_slice_ms;
    int num_threads;
    pid_t pgid;
    pid_t sid;
    int active;
} ManagedProcess;

typedef struct {
    int total_processes;
    int running_count;
    int paused_count;
    int failed_count;
    int total_restarts;
    unsigned long total_memory_kb;
    time_t last_update;
    char last_event[MAX_LOG_MSG];
    pthread_mutex_t lock;
} SupervisorDashboard;

typedef struct Task {
    void (*function)(void *arg);
    void *arg;
    struct Task *next;
} Task;

typedef struct {
    pthread_t threads[THREAD_POOL_SIZE];
    Task *task_queue_head;
    Task *task_queue_tail;
    pthread_mutex_t queue_mutex;
    pthread_cond_t queue_cond;
    sem_t task_semaphore;
    int shutdown;
    int active_tasks;
    pthread_mutex_t active_mutex;
    pthread_cond_t active_cond;
} ThreadPool;

typedef struct {
    ManagedProcess processes[MAX_PROCESSES];
    int process_count;
    pthread_mutex_t proc_mutex;
    pthread_rwlock_t proc_rwlock;
    SupervisorDashboard *dashboard;
    int shm_fd;
    ThreadPool *thread_pool;
    SchedPolicy sched_policy;
    int fifo_fd;
    int running;
    pid_t supervisor_pid;
    pid_t supervisor_pgid;
    int log_fd;
    pthread_mutex_t log_mutex;
    char *mmap_config;
    size_t mmap_config_size;
} SupervisorContext;

extern SupervisorContext g_ctx;
const char *state_to_string(ProcessState state);
void get_timestamp(char *buf, size_t len);

#endif
