#include "process_manager.h"
#include "logger.h"
#include "memory_monitor.h"

int pm_init(void) {
    pthread_mutex_init(&g_ctx.proc_mutex, NULL);
    pthread_rwlock_init(&g_ctx.proc_rwlock, NULL);
    memset(g_ctx.processes, 0, sizeof(g_ctx.processes));
    g_ctx.process_count = 0;
    log_event("Process manager initialized");
    return 0;
}

void pm_cleanup(void) {
    pthread_mutex_destroy(&g_ctx.proc_mutex);
    pthread_rwlock_destroy(&g_ctx.proc_rwlock);
}

ManagedProcess *pm_find_by_id(int id) {
    for (int i = 0; i < MAX_PROCESSES; i++) {
        if (g_ctx.processes[i].active && g_ctx.processes[i].id == id) {
            return &g_ctx.processes[i];
        }
    }
    return NULL;
}

ManagedProcess *pm_find_by_pid(pid_t pid) {
    for (int i = 0; i < MAX_PROCESSES; i++) {
        if (g_ctx.processes[i].active && g_ctx.processes[i].pid == pid) {
            return &g_ctx.processes[i];
        }
    }
    return NULL;
}

void pm_export_json_status(void) {
    pthread_rwlock_rdlock(&g_ctx.proc_rwlock);

    char tmp_file[128] = "/tmp/supervisor_status.json.tmp";
    char final_file[128] = "/tmp/supervisor_status.json";

    FILE *fp = fopen(tmp_file, "w");
    if (!fp) {
        pthread_rwlock_unlock(&g_ctx.proc_rwlock);
        return;
    }

    int running = 0, paused = 0, failed = 0, total_restarts = 0;
    unsigned long total_mem = 0;

    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *p = &g_ctx.processes[i];
        if (!p->active) continue;
        if (p->state == STATE_RUNNING) running++;
        else if (p->state == STATE_PAUSED) paused++;
        else if (p->state == STATE_FAILED) failed++;
        total_restarts += p->restart_count;
        total_mem += p->vm_rss_kb;
    }

    fprintf(fp, "{\n");
    fprintf(fp, "  \"supervisor_pid\": %d,\n", g_ctx.supervisor_pid);
    fprintf(fp, "  \"running_count\": %d,\n", running);
    fprintf(fp, "  \"paused_count\": %d,\n", paused);
    fprintf(fp, "  \"failed_count\": %d,\n", failed);
    fprintf(fp, "  \"total_restarts\": %d,\n", total_restarts);
    fprintf(fp, "  \"total_rss_kb\": %lu,\n", total_mem);
    fprintf(fp, "  \"policy\": \"%s\",\n",
            g_ctx.sched_policy == SCHED_FCFS ? "FCFS" :
            g_ctx.sched_policy == SCHED_ROUND_ROBIN ? "Round Robin" : "Priority");
    fprintf(fp, "  \"processes\": [\n");

    int first = 1;
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *p = &g_ctx.processes[i];
        if (!p->active) continue;

        if (p->state == STATE_RUNNING || p->state == STATE_PAUSED) {
            mm_update_process_memory(p);
        }

        if (!first) fprintf(fp, ",\n");
        first = 0;

        fprintf(fp, "    {\n");
        fprintf(fp, "      \"id\": %d,\n", p->id);
        fprintf(fp, "      \"name\": \"%s\",\n", p->name);
        fprintf(fp, "      \"command\": \"%s\",\n", p->command);
        fprintf(fp, "      \"pid\": %d,\n", p->pid);
        fprintf(fp, "      \"state\": \"%s\",\n", state_to_string(p->state));
        fprintf(fp, "      \"priority\": %d,\n", p->priority);
        fprintf(fp, "      \"restart_count\": %d,\n", p->restart_count);
        fprintf(fp, "      \"vm_rss_kb\": %lu,\n", p->vm_rss_kb);
        fprintf(fp, "      \"vm_size_kb\": %lu,\n", p->vm_size_kb);
        fprintf(fp, "      \"threads\": %d,\n", p->num_threads);
        fprintf(fp, "      \"start_time\": %ld\n", (long)p->start_time);
        fprintf(fp, "    }");
    }

    fprintf(fp, "\n  ]\n}\n");
    fclose(fp);

    rename(tmp_file, final_file);
    pthread_rwlock_unlock(&g_ctx.proc_rwlock);
}

int pm_start_process(const char *name, const char *command, int priority) {
    pthread_mutex_lock(&g_ctx.proc_mutex);
    int slot = -1;
    for (int i = 0; i < MAX_PROCESSES; i++) {
        if (!g_ctx.processes[i].active) {
            slot = i;
            break;
        }
    }
    if (slot == -1) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }

    ManagedProcess *proc = &g_ctx.processes[slot];
    memset(proc, 0, sizeof(ManagedProcess));
    proc->id = slot + 1;
    strncpy(proc->name, name, MAX_NAME_LEN - 1);
    strncpy(proc->command, command, MAX_CMD_LEN - 1);
    proc->priority = priority;
    proc->state = STATE_READY;
    proc->active = 1;

    if (pipe(proc->pipe_fd) == -1) {
        proc->active = 0;
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    proc->ipc_method = IPC_PIPE;

    snprintf(proc->log_path, MAX_PATH_LEN, "/tmp/sup_proc_%d.log", proc->id);
    proc->log_fd = open(proc->log_path, O_WRONLY | O_CREAT | O_TRUNC, 0644);

    log_event("CO-1: fork() for '%s' (cmd: %s)", name, command);
    pid_t pid = fork();
    if (pid < 0) {
        close(proc->pipe_fd[0]);
        close(proc->pipe_fd[1]);
        if (proc->log_fd != -1) close(proc->log_fd);
        proc->active = 0;
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    if (pid == 0) {
        close(proc->pipe_fd[0]);
        dup2(proc->pipe_fd[1], STDOUT_FILENO);
        close(proc->pipe_fd[1]);
        setpgid(0, 0);
        if (proc->log_fd != -1) {
            dup2(proc->log_fd, STDERR_FILENO);
            close(proc->log_fd);
        }
        execl("/bin/sh", "sh", "-c", command, (char *)NULL);
        _exit(EXIT_FAILURE);
    }

    proc->pid = pid;
    proc->state = STATE_RUNNING;
    proc->start_time = time(NULL);
    close(proc->pipe_fd[1]);
    proc->pipe_fd[1] = -1;
    setpgid(pid, pid);
    proc->pgid = pid;
    proc->sid = getsid(pid);
    g_ctx.process_count++;
    mm_update_process_memory(proc);
    pthread_mutex_unlock(&g_ctx.proc_mutex);

    log_event("STARTED: '%s' ID=%d PID=%d Pri=%d", name, proc->id, pid, priority);
    printf("\n  [PROCESS STARTED] '%s' (ID: %d, PID: %d, Priority: %d)\n", name, proc->id, pid, priority);

    pm_export_json_status();
    return proc->id;
}

int pm_stop_process(int id) {
    pthread_mutex_lock(&g_ctx.proc_mutex);
    ManagedProcess *proc = pm_find_by_id(id);
    if (!proc || !proc->active) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    if (proc->state != STATE_RUNNING && proc->state != STATE_PAUSED) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    proc->intentional_stop = 1;
    if (proc->state == STATE_PAUSED) {
        kill(proc->pid, SIGCONT);
        usleep(100000);
    }
    log_event("CO-3: SIGTERM to '%s' PID=%d", proc->name, proc->pid);
    kill(proc->pid, SIGTERM);
    int status;
    pid_t r = waitpid(proc->pid, &status, WNOHANG);
    if (r == 0) {
        usleep(500000);
        r = waitpid(proc->pid, &status, WNOHANG);
        if (r == 0) {
            kill(proc->pid, SIGKILL);
            waitpid(proc->pid, &status, 0);
        }
    }
    proc->state = STATE_STOPPED;
    proc->end_time = time(NULL);
    if (proc->log_fd != -1) { close(proc->log_fd); proc->log_fd = -1; }
    if (proc->pipe_fd[0] != -1) { close(proc->pipe_fd[0]); proc->pipe_fd[0] = -1; }
    pthread_mutex_unlock(&g_ctx.proc_mutex);
    log_event("STOPPED: '%s' ID=%d (Intentional)", proc->name, id);
    printf("  [STOPPED] '%s' (ID %d) stopped intentionally.\n", proc->name, id);
    pm_export_json_status();
    return 0;
}

int pm_pause_process(int id) {
    pthread_mutex_lock(&g_ctx.proc_mutex);
    ManagedProcess *proc = pm_find_by_id(id);
    if (!proc || !proc->active || proc->state != STATE_RUNNING) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    kill(proc->pid, SIGSTOP);
    proc->state = STATE_PAUSED;
    pthread_mutex_unlock(&g_ctx.proc_mutex);
    log_event("PAUSED: '%s' ID=%d", proc->name, id);
    printf("  [PAUSED] '%s' (PID %d)\n", proc->name, proc->pid);
    pm_export_json_status();
    return 0;
}

int pm_resume_process(int id) {
    pthread_mutex_lock(&g_ctx.proc_mutex);
    ManagedProcess *proc = pm_find_by_id(id);
    if (!proc || !proc->active || proc->state != STATE_PAUSED) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    kill(proc->pid, SIGCONT);
    proc->state = STATE_RUNNING;
    pthread_mutex_unlock(&g_ctx.proc_mutex);
    log_event("RESUMED: '%s' ID=%d", proc->name, id);
    printf("  [RESUMED] '%s' (PID %d)\n", proc->name, proc->pid);
    pm_export_json_status();
    return 0;
}

int pm_terminate_process(int id) {
    pthread_mutex_lock(&g_ctx.proc_mutex);
    ManagedProcess *proc = pm_find_by_id(id);
    if (!proc || !proc->active) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    proc->intentional_stop = 1;
    if (proc->state == STATE_PAUSED) {
        kill(proc->pid, SIGCONT);
        usleep(50000);
    }
    kill(proc->pid, SIGKILL);
    int st;
    waitpid(proc->pid, &st, 0);
    proc->state = STATE_EXITED;
    proc->end_time = time(NULL);
    if (proc->log_fd != -1) { close(proc->log_fd); proc->log_fd = -1; }
    if (proc->pipe_fd[0] != -1) { close(proc->pipe_fd[0]); proc->pipe_fd[0] = -1; }
    pthread_mutex_unlock(&g_ctx.proc_mutex);
    log_event("TERMINATED: '%s' ID=%d SIGKILL", proc->name, id);
    printf("  [TERMINATED] '%s' (PID %d) terminated with SIGKILL.\n", proc->name, proc->pid);
    pm_export_json_status();
    return 0;
}

int pm_restart_process(int id) {
    pthread_mutex_lock(&g_ctx.proc_mutex);
    ManagedProcess *proc = pm_find_by_id(id);
    if (!proc || !proc->active) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    pid_t old = proc->pid;
    char cmd[MAX_CMD_LEN];
    strncpy(cmd, proc->command, MAX_CMD_LEN - 1);
    if (proc->pipe_fd[0] != -1) { close(proc->pipe_fd[0]); proc->pipe_fd[0] = -1; }
    if (pipe(proc->pipe_fd) == -1) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    pid_t pid = fork();
    if (pid < 0) {
        pthread_mutex_unlock(&g_ctx.proc_mutex);
        return -1;
    }
    if (pid == 0) {
        close(proc->pipe_fd[0]);
        dup2(proc->pipe_fd[1], STDOUT_FILENO);
        close(proc->pipe_fd[1]);
        setpgid(0, 0);
        if (proc->log_fd != -1) {
            dup2(proc->log_fd, STDERR_FILENO);
            close(proc->log_fd);
        }
        execl("/bin/sh", "sh", "-c", cmd, (char *)NULL);
        _exit(EXIT_FAILURE);
    }
    close(proc->pipe_fd[1]);
    proc->pipe_fd[1] = -1;
    proc->pid = pid;
    proc->state = STATE_RUNNING;
    proc->restart_count++;
    proc->intentional_stop = 0;
    proc->start_time = time(NULL);
    proc->end_time = 0;
    setpgid(pid, pid);
    proc->pgid = pid;
    pthread_mutex_unlock(&g_ctx.proc_mutex);

    log_event("RESTARTED: '%s' (Old PID=%d -> New PID=%d, Restarts=%d)",
              proc->name, old, pid, proc->restart_count);

    printf("\n  ===============================================================\n");
    printf("  [AUTO-RECOVERY] Replacement Spawned for '%s'\n", proc->name);
    printf("    Old Dead PID : %d\n", old);
    printf("    New Live PID : %d\n", pid);
    printf("    Restart Count: %d\n", proc->restart_count);
    printf("  ===============================================================\n");
    printf("  Enter choice: ");
    fflush(stdout);

    pm_export_json_status();
    return 0;
}

void pm_check_all_processes(void) {
    pthread_rwlock_wrlock(&g_ctx.proc_rwlock);
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *proc = &g_ctx.processes[i];
        if (!proc->active || (proc->state != STATE_RUNNING && proc->state != STATE_PAUSED)) continue;
        int status;
        pid_t r = waitpid(proc->pid, &status, WNOHANG | WUNTRACED | WCONTINUED);
        if (r == 0) {
            mm_update_process_memory(proc);
            continue;
        }
        if (r == proc->pid) {
            if (WIFEXITED(status)) {
                proc->state = proc->intentional_stop ? STATE_EXITED : STATE_RESTARTING;
                proc->end_time = time(NULL);
                int code = WEXITSTATUS(status);
                log_event("%s: '%s' PID=%d code=%d",
                          proc->intentional_stop ? "EXITED" : "UNEXPECTED",
                          proc->name, proc->pid, code);
                if (!proc->intentional_stop) {
                    printf("\n\n  [UNEXPECTED EXIT] '%s' (PID %d) exited with status code %d!\n",
                           proc->name, proc->pid, code);
                    fflush(stdout);
                }
            } else if (WIFSIGNALED(status)) {
                proc->state = proc->intentional_stop ? STATE_EXITED : STATE_RESTARTING;
                proc->end_time = time(NULL);
                int sig = WTERMSIG(status);
                log_event("KILLED: '%s' PID=%d sig=%d", proc->name, proc->pid, sig);
                if (!proc->intentional_stop) {
                    printf("\n\n  [CRASH DETECTED] Process '%s' (PID %d) was killed by signal %d!\n",
                           proc->name, proc->pid, sig);
                    fflush(stdout);
                }
            } else if (WIFSTOPPED(status)) {
                proc->state = STATE_PAUSED;
            } else if (WIFCONTINUED(status)) {
                proc->state = STATE_RUNNING;
            }
        }
    }
    pthread_rwlock_unlock(&g_ctx.proc_rwlock);
    for (int i = 0; i < MAX_PROCESSES; i++) {
        if (g_ctx.processes[i].active && g_ctx.processes[i].state == STATE_RESTARTING) {
            pm_restart_process(g_ctx.processes[i].id);
        }
    }
}

void *pm_watchdog_thread(void *arg) {
    (void)arg;
    while (g_ctx.running) {
        pm_check_all_processes();
        pm_export_json_status();
        usleep(200000);
    }
    return NULL;
}

void pm_show_status(void) {
    pthread_rwlock_rdlock(&g_ctx.proc_rwlock);
    printf("\n  +----+--------------------+--------+------------+----------+----------+---------+---------+\n");
    printf("  | ID | Name               |  PID   |   State    | Priority | Restarts | VmRSS   | Threads |\n");
    printf("  +----+--------------------+--------+------------+----------+----------+---------+---------+\n");
    int count = 0;
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *proc = &g_ctx.processes[i];
        if (!proc->active) continue;
        count++;
        if (proc->state == STATE_RUNNING || proc->state == STATE_PAUSED) {
            mm_update_process_memory(proc);
        }
        printf("  | %2d | %-18s | %6d | %-10s |    %2d    |    %3d   | %4lu MB |    %2d   |\n",
               proc->id, proc->name, proc->pid, state_to_string(proc->state),
               proc->priority, proc->restart_count, proc->vm_rss_kb / 1024, proc->num_threads);
    }
    if (count == 0) printf("  |                    No managed processes active                                    |\n");
    printf("  +----+--------------------+--------+------------+----------+----------+---------+---------+\n\n");
    pthread_rwlock_unlock(&g_ctx.proc_rwlock);
}

void pm_show_process_details(int id) {
    pthread_rwlock_rdlock(&g_ctx.proc_rwlock);
    ManagedProcess *proc = pm_find_by_id(id);
    if (!proc || !proc->active) {
        printf("  Process ID %d not found.\n", id);
        pthread_rwlock_unlock(&g_ctx.proc_rwlock);
        return;
    }
    printf("\n  === PROCESS DETAIL: %s ===\n", proc->name);
    printf("  ID: %d | PID: %d | PGID: %d | SID: %d\n", proc->id, proc->pid, proc->pgid, proc->sid);
    printf("  State: %s | Command: %s | Priority: %d\n", state_to_string(proc->state), proc->command, proc->priority);
    printf("  Restart Count: %d | Minor Faults: %lu | Major Faults: %lu\n",
           proc->restart_count, proc->page_faults_minor, proc->page_faults_major);
    printf("  VmSize: %lu KB | VmRSS: %lu KB | Threads: %d\n\n",
           proc->vm_size_kb, proc->vm_rss_kb, proc->num_threads);
    pthread_rwlock_unlock(&g_ctx.proc_rwlock);
}

void pm_show_state_diagram(void) {
    printf("\n  === CO-2: PROCESS STATE TRANSITION DIAGRAM ===\n\n");
    printf("  [IDLE] --fork()--> [READY] --exec()--> [RUNNING]\n");
    printf("                                            |    |\n");
    printf("                                   SIGSTOP  |    | exit() / signal\n");
    printf("                                            v    |\n");
    printf("                                         [PAUSED] v\n");
    printf("                                            |  [EXITED / FAILED]\n");
    printf("                                   SIGCONT  |    |\n");
    printf("                                            v    | unexpected?\n");
    printf("                                         [RUNNING] +--> [RESTARTING] --> [RUNNING]\n");
    printf("                                                   +--> [STOPPED]\n\n");
}

void pm_shutdown_all(void) {
    log_event("CO-1: Initiating safe shutdown of processes");
    pthread_mutex_lock(&g_ctx.proc_mutex);
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *proc = &g_ctx.processes[i];
        if (!proc->active) continue;
        if (proc->state != STATE_RUNNING && proc->state != STATE_PAUSED) continue;
        proc->intentional_stop = 1;
        if (proc->state == STATE_PAUSED) { kill(proc->pid, SIGCONT); usleep(50000); }
        kill(proc->pid, SIGTERM);
    }
    pthread_mutex_unlock(&g_ctx.proc_mutex);
    usleep(500000);
    pthread_mutex_lock(&g_ctx.proc_mutex);
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *proc = &g_ctx.processes[i];
        if (!proc->active || proc->state == STATE_STOPPED || proc->state == STATE_EXITED) continue;
        int st;
        pid_t r = waitpid(proc->pid, &st, WNOHANG);
        if (r == 0) { kill(proc->pid, SIGKILL); waitpid(proc->pid, &st, 0); }
        proc->state = STATE_STOPPED;
        if (proc->log_fd != -1) { close(proc->log_fd); proc->log_fd = -1; }
        if (proc->pipe_fd[0] != -1) { close(proc->pipe_fd[0]); proc->pipe_fd[0] = -1; }
    }
    pthread_mutex_unlock(&g_ctx.proc_mutex);
    unlink("/tmp/supervisor_status.json");
    log_event("All managed processes cleaned up");
}

const char *state_to_string(ProcessState state) {
    switch (state) {
        case STATE_IDLE:       return "IDLE";
        case STATE_READY:      return "READY";
        case STATE_RUNNING:    return "RUNNING";
        case STATE_PAUSED:     return "PAUSED";
        case STATE_STOPPED:    return "STOPPED";
        case STATE_EXITED:     return "EXITED";
        case STATE_FAILED:     return "FAILED";
        case STATE_RESTARTING: return "RESTARTING";
        default:               return "UNKNOWN";
    }
}

void get_timestamp(char *buf, size_t len) {
    time_t now = time(NULL);
    struct tm *tm = localtime(&now);
    strftime(buf, len, "%Y-%m-%d %H:%M:%S", tm);
}
