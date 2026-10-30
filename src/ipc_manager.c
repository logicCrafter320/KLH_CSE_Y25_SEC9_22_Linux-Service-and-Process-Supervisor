#include "ipc_manager.h"
#include "logger.h"
#include "process_manager.h"
#include "config.h"

static volatile sig_atomic_t g_sigchld_received = 0;

static void sigchld_handler(int sig, siginfo_t *info, void *context) {
    (void)sig; (void)context; (void)info;
    g_sigchld_received = 1;
}

static void sigint_handler(int sig) {
    (void)sig;
    printf("\n  [SUPERVISOR] Caught SIGINT — safe shutdown...\n");
    g_ctx.running = 0;
}

void ipc_setup_signal_handlers(void) {
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_sigaction = sigchld_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_SIGINFO | SA_RESTART | SA_NOCLDSTOP;
    sigaction(SIGCHLD, &sa, NULL);

    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = sigint_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART;
    sigaction(SIGINT, &sa, NULL);

    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = SIG_IGN;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART;
    sigaction(SIGPIPE, &sa, NULL);

    log_event("CO-3: Signal handlers installed (SIGCHLD, SIGINT, SIGPIPE)");
}

int ipc_init(void) {
    ipc_setup_signal_handlers();
    unlink(FIFO_PATH);
    if (mkfifo(FIFO_PATH, 0666) == -1) {
        log_event("WARNING: Could not create FIFO at %s", FIFO_PATH);
    } else {
        log_event("CO-3: Created named pipe (FIFO) at %s", FIFO_PATH);
    }
    return 0;
}

void ipc_cleanup(void) {
    unlink(FIFO_PATH);
    log_event("CO-3: IPC cleanup complete");
}

int ipc_read_pipe(int id, char *buf, size_t len) {
    ManagedProcess *proc = pm_find_by_id(id);
    if (!proc || !proc->active || proc->pipe_fd[0] == -1) return -1;
    int flags = fcntl(proc->pipe_fd[0], F_GETFL);
    fcntl(proc->pipe_fd[0], F_SETFL, flags | O_NONBLOCK);
    ssize_t bytes = read(proc->pipe_fd[0], buf, len - 1);
    fcntl(proc->pipe_fd[0], F_SETFL, flags);
    if (bytes > 0) { buf[bytes] = '\0'; return (int)bytes; }
    return 0;
}

int ipc_demo_pipe_chain(void) {
    int pipefd[2];
    printf("\n  === CO-3: PIPE CHAIN DEMO (cmd1 | cmd2) ===\n\n");
    if (pipe(pipefd) == -1) { perror("pipe"); return -1; }
    log_event("CO-3: Created pipe for chain demo (r=%d, w=%d)", pipefd[0], pipefd[1]);

    pid_t pid1 = fork();
    if (pid1 == 0) {
        close(pipefd[0]);
        dup2(pipefd[1], STDOUT_FILENO);
        close(pipefd[1]);
        execlp("ls", "ls", "-la", "/proc/self", NULL);
        _exit(1);
    }

    pid_t pid2 = fork();
    if (pid2 == 0) {
        close(pipefd[1]);
        dup2(pipefd[0], STDIN_FILENO);
        close(pipefd[0]);
        execlp("wc", "wc", "-l", NULL);
        _exit(1);
    }

    close(pipefd[0]);
    close(pipefd[1]);
    printf("  Pipe chain: ls -la /proc/self | wc -l\n");
    printf("  Child 1 PID: %d, Child 2 PID: %d\n  Output: ", pid1, pid2);
    fflush(stdout);
    int s1, s2;
    waitpid(pid1, &s1, 0);
    waitpid(pid2, &s2, 0);
    printf("\n  Pipe chain demo complete.\n\n");
    log_event("CO-3: Pipe chain demo done (PID1=%d, PID2=%d)", pid1, pid2);
    return 0;
}

void *ipc_fifo_listener_thread(void *arg) {
    (void)arg;
    char buf[PIPE_BUF_SIZE];
    log_event("CO-3: FIFO listener started at %s", FIFO_PATH);

    while (g_ctx.running) {
        int fd = open(FIFO_PATH, O_RDONLY);
        if (fd == -1) {
            usleep(200000);
            continue;
        }
        ssize_t bytes = read(fd, buf, sizeof(buf) - 1);
        close(fd);

        if (bytes > 0) {
            buf[bytes] = '\0';
            char *nl = strchr(buf, '\n');
            if (nl) *nl = '\0';
            char *cr = strchr(buf, '\r');
            if (cr) *cr = '\0';

            log_event("CO-3: FIFO command received: '%s'", buf);

            if (strcmp(buf, "status") == 0) {
                pm_show_status();
            } else if (strncmp(buf, "START_CONFIG:", 13) == 0) {
                int svc_idx = atoi(buf + 13);
                if (svc_idx >= 0 && svc_idx < g_service_count) {
                    pm_start_process(g_services[svc_idx].name,
                                     g_services[svc_idx].command,
                                     g_services[svc_idx].priority);
                }
            } else if (strncmp(buf, "START_CUSTOM:", 13) == 0) {
                char *payload = buf + 13;
                char *p1 = strchr(payload, '|');
                if (p1) {
                    *p1 = '\0';
                    char *name = payload;
                    char *rest = p1 + 1;
                    char *p2 = strchr(rest, '|');
                    if (p2) {
                        *p2 = '\0';
                        char *cmd = rest;
                        int pri = atoi(p2 + 1);
                        if (pri < 1) pri = 1;
                        if (pri > 10) pri = 10;
                        pm_start_process(name, cmd, pri);
                    }
                }
            } else if (strncmp(buf, "STOP:", 5) == 0) {
                int id = atoi(buf + 5);
                pm_stop_process(id);
            } else if (strncmp(buf, "PAUSE:", 6) == 0) {
                int id = atoi(buf + 6);
                pm_pause_process(id);
            } else if (strncmp(buf, "RESUME:", 7) == 0) {
                int id = atoi(buf + 7);
                pm_resume_process(id);
            } else if (strncmp(buf, "KILL:", 5) == 0) {
                int id = atoi(buf + 5);
                pm_terminate_process(id);
            }
        }
        usleep(100000);
    }
    return NULL;
}

void ipc_send_signal_to_group(pid_t pgid, int sig) {
    log_event("CO-3: Sending signal %d to PGID %d", sig, pgid);
    killpg(pgid, sig);
}
