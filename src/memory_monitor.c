#include "memory_monitor.h"
#include "logger.h"

int mm_init(void) {
    log_event("CO-4: Memory monitor initialized");
    return mm_create_shared_dashboard();
}

void mm_cleanup(void) {
    mm_destroy_shared_dashboard();
    log_event("CO-4: Memory monitor cleaned up");
}

int mm_update_process_memory(ManagedProcess *proc) {
    if (!proc || proc->pid <= 0) return -1;
    char path[MAX_PATH_LEN], line[512];
    snprintf(path, sizeof(path), "/proc/%d/status", proc->pid);
    FILE *fp = fopen(path, "r");
    if (!fp) return -1;
    proc->vm_shared_kb = 0;
    while (fgets(line, sizeof(line), fp)) {
        if (strncmp(line, "VmSize:", 7) == 0) sscanf(line + 7, " %lu", &proc->vm_size_kb);
        else if (strncmp(line, "VmRSS:", 6) == 0) sscanf(line + 6, " %lu", &proc->vm_rss_kb);
        else if (strncmp(line, "Threads:", 8) == 0) sscanf(line + 8, " %d", &proc->num_threads);
    }
    fclose(fp);

    snprintf(path, sizeof(path), "/proc/%d/stat", proc->pid);
    fp = fopen(path, "r");
    if (fp) {
        int p; char c[256]; char st; int sk[5]; unsigned int fl;
        unsigned long minf, cminf, majf;
        if (fscanf(fp, "%d %255s %c %d %d %d %d %d %u %lu %lu %lu",
                   &p, c, &st, &sk[0], &sk[1], &sk[2], &sk[3], &sk[4], &fl,
                   &minf, &cminf, &majf) >= 12) {
            proc->page_faults_minor = minf;
            proc->page_faults_major = majf;
        }
        fclose(fp);
    }
    return 0;
}

void mm_show_process_memory_map(pid_t pid) {
    char path[MAX_PATH_LEN], line[1024];
    snprintf(path, sizeof(path), "/proc/%d/maps", pid);
    FILE *fp = fopen(path, "r");
    if (!fp) { printf("  [ERROR] Cannot read maps for PID %d\n", pid); return; }

    printf("\n  === CO-4: VIRTUAL MEMORY MAP FOR PID %d ===\n", pid);
    printf("  Address Range              Perms  Type\n");
    printf("  -----------------------------------------------------------\n");
    int count = 0;
    while (fgets(line, sizeof(line), fp) && count < 25) {
        line[strcspn(line, "\n")] = 0;
        unsigned long start, end, offset;
        char perms[8] = {0}, pathname[512] = "";
        int dmaj, dmin; unsigned long inode;
        if (sscanf(line, "%lx-%lx %4s %lx %x:%x %lu %511[^\n]",
                   &start, &end, perms, &offset, &dmaj, &dmin, &inode, pathname) >= 7) {
            const char *type = "[anon]";
            if (strstr(pathname, "[heap]")) type = "[HEAP]";
            else if (strstr(pathname, "[stack]")) type = "[STACK]";
            else if (strstr(pathname, "[vdso]")) type = "[vDSO]";
            else if (perms[2] == 'x' && pathname[0] == '/') type = "[CODE]";
            else if (strstr(pathname, ".so")) type = "[LIB]";
            printf("  %012lx-%012lx %s  %s %s\n", start, end, perms, type, pathname);
            count++;
        }
    }
    printf("  Legend: [CODE]=Text [HEAP]=malloc [STACK]=Stack [LIB]=Shared lib\n\n");
    fclose(fp);
}

void mm_show_system_memory(void) {
    FILE *fp = fopen("/proc/meminfo", "r");
    if (!fp) { printf("  [ERROR] Cannot read /proc/meminfo\n"); return; }
    char line[256];
    unsigned long mt = 0, mf = 0, ma = 0, buf = 0, cached = 0, st = 0, sf = 0;
    while (fgets(line, sizeof(line), fp)) {
        if (strncmp(line, "MemTotal:", 9) == 0) sscanf(line+9, " %lu", &mt);
        else if (strncmp(line, "MemFree:", 8) == 0) sscanf(line+8, " %lu", &mf);
        else if (strncmp(line, "MemAvailable:", 13) == 0) sscanf(line+13, " %lu", &ma);
        else if (strncmp(line, "Buffers:", 8) == 0) sscanf(line+8, " %lu", &buf);
        else if (strncmp(line, "Cached:", 7) == 0) sscanf(line+7, " %lu", &cached);
        else if (strncmp(line, "SwapTotal:", 10) == 0) sscanf(line+10, " %lu", &st);
        else if (strncmp(line, "SwapFree:", 9) == 0) sscanf(line+9, " %lu", &sf);
    }
    fclose(fp);
    unsigned long used = mt - mf - buf - cached;
    double pct = (double)used / mt * 100.0;
    printf("\n  === CO-4: SYSTEM MEMORY ===\n");
    printf("  Total: %lu MB | Free: %lu MB | Available: %lu MB\n", mt/1024, mf/1024, ma/1024);
    printf("  Used: %lu MB (%.1f%%) | Buffers: %lu MB | Cached: %lu MB\n", used/1024, pct, buf/1024, cached/1024);
    printf("  Swap Total: %lu MB | Swap Free: %lu MB\n", st/1024, sf/1024);
    printf("  Usage: [");
    int bw = 30, filled = (int)(pct / 100.0 * bw);
    for (int i = 0; i < bw; i++) printf("%s", i < filled ? "#" : ".");
    printf("] %.1f%%\n\n", pct);
}

int mm_create_shared_dashboard(void) {
    g_ctx.shm_fd = shm_open(SHARED_MEM_NAME, O_CREAT | O_RDWR, 0666);
    if (g_ctx.shm_fd == -1) { perror("shm_open"); return -1; }
    if (ftruncate(g_ctx.shm_fd, sizeof(SupervisorDashboard)) == -1) return -1;
    g_ctx.dashboard = mmap(NULL, sizeof(SupervisorDashboard),
                           PROT_READ | PROT_WRITE, MAP_SHARED, g_ctx.shm_fd, 0);
    if (g_ctx.dashboard == MAP_FAILED) { g_ctx.dashboard = NULL; return -1; }
    pthread_mutexattr_t attr;
    pthread_mutexattr_init(&attr);
    pthread_mutexattr_setpshared(&attr, PTHREAD_PROCESS_SHARED);
    pthread_mutex_init(&g_ctx.dashboard->lock, &attr);
    pthread_mutexattr_destroy(&attr);
    memset(g_ctx.dashboard, 0, sizeof(SupervisorDashboard));
    g_ctx.dashboard->last_update = time(NULL);
    log_event("CO-4: Shared memory dashboard created (%zu bytes)", sizeof(SupervisorDashboard));
    return 0;
}

void mm_destroy_shared_dashboard(void) {
    if (g_ctx.dashboard) {
        pthread_mutex_destroy(&g_ctx.dashboard->lock);
        munmap(g_ctx.dashboard, sizeof(SupervisorDashboard));
        g_ctx.dashboard = NULL;
    }
    if (g_ctx.shm_fd != -1) { close(g_ctx.shm_fd); shm_unlink(SHARED_MEM_NAME); }
}

void mm_update_dashboard(void) {
    if (!g_ctx.dashboard) return;
    pthread_mutex_lock(&g_ctx.dashboard->lock);
    int r = 0, p = 0, f = 0; unsigned long tm = 0;
    for (int i = 0; i < MAX_PROCESSES; i++) {
        if (!g_ctx.processes[i].active) continue;
        if (g_ctx.processes[i].state == STATE_RUNNING) r++;
        if (g_ctx.processes[i].state == STATE_PAUSED) p++;
        if (g_ctx.processes[i].state == STATE_FAILED) f++;
        tm += g_ctx.processes[i].vm_rss_kb;
    }
    g_ctx.dashboard->running_count = r;
    g_ctx.dashboard->paused_count = p;
    g_ctx.dashboard->failed_count = f;
    g_ctx.dashboard->total_memory_kb = tm;
    g_ctx.dashboard->last_update = time(NULL);
    pthread_mutex_unlock(&g_ctx.dashboard->lock);
}

void mm_show_dashboard(void) {
    if (!g_ctx.dashboard) { printf("  Dashboard not available\n"); return; }
    mm_update_dashboard();
    pthread_mutex_lock(&g_ctx.dashboard->lock);
    char tb[64]; struct tm *t = localtime(&g_ctx.dashboard->last_update);
    strftime(tb, sizeof(tb), "%H:%M:%S", t);
    printf("\n  === CO-4: SHARED MEMORY DASHBOARD (%s) ===\n", tb);
    printf("  Total: %d | Running: %d | Paused: %d | Failed: %d\n",
           g_ctx.dashboard->total_processes, g_ctx.dashboard->running_count,
           g_ctx.dashboard->paused_count, g_ctx.dashboard->failed_count);
    printf("  Restarts: %d | Total RSS: %lu KB\n",
           g_ctx.dashboard->total_restarts, g_ctx.dashboard->total_memory_kb);
    printf("  Last Event: %s\n\n", g_ctx.dashboard->last_event);
    pthread_mutex_unlock(&g_ctx.dashboard->lock);
}

void mm_demo_cow(void) {
    printf("\n  === CO-4: COPY-ON-WRITE DEMO ===\n\n");
    size_t sz = 4 * 1024 * 1024;
    char *data = malloc(sz);
    if (!data) return;
    memset(data, 'A', sz);
    printf("  Parent PID: %d, Allocated 4 MB filled with 'A'\n", getpid());
    printf("  Calling fork()... (kernel marks pages read-only, shared)\n\n");
    pid_t pid = fork();
    if (pid == 0) {
        printf("  [CHILD %d] Reading data[0]='%c' (no fault, shared)\n", getpid(), data[0]);
        printf("  [CHILD] Writing data[0]='B' (triggers COW page fault!)\n");
        data[0] = 'B';
        printf("  [CHILD] data[0]='%c' (own copy now)\n", data[0]);
        free(data);
        _exit(0);
    } else if (pid > 0) {
        usleep(200000);
        printf("  [PARENT] data[0]='%c' (unchanged)\n", data[0]);
        int st; waitpid(pid, &st, 0);
        printf("\n  COW: fork() does NOT copy 4MB. Pages shared read-only.\n");
        printf("  Writing triggers page fault -> kernel copies just that page.\n\n");
        free(data);
    } else { free(data); }
    log_event("CO-4: COW demo completed");
}

void mm_demo_page_faults(void) {
    printf("\n  === CO-4: DEMAND PAGING & PAGE FAULT DEMO ===\n\n");
    char sp[128]; snprintf(sp, sizeof(sp), "/proc/%d/stat", getpid());
    unsigned long fb = 0, fa = 0;
    FILE *fp = fopen(sp, "r");
    if (fp) {
        int p; char c[256]; char st; int sk[5]; unsigned int fl; unsigned long mf;
        if (fscanf(fp, "%d %255s %c %d %d %d %d %d %u %lu",
                   &p, c, &st, &sk[0], &sk[1], &sk[2], &sk[3], &sk[4], &fl, &mf) >= 10)
            fb = mf;
        fclose(fp);
    }
    printf("  Minor faults before: %lu\n", fb);
    size_t msz = 16 * 4096;
    printf("  Allocating %zu bytes via mmap() (pages NOT in RAM yet!)\n", msz);
    char *m = mmap(NULL, msz, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (m == MAP_FAILED) { perror("mmap"); return; }
    printf("  Touching each page (triggers minor page faults)...\n");
    for (size_t i = 0; i < msz; i += 4096) m[i] = 'X';
    fp = fopen(sp, "r");
    if (fp) {
        int p; char c[256]; char st; int sk[5]; unsigned int fl; unsigned long mf;
        if (fscanf(fp, "%d %255s %c %d %d %d %d %d %u %lu",
                   &p, c, &st, &sk[0], &sk[1], &sk[2], &sk[3], &sk[4], &fl, &mf) >= 10)
            fa = mf;
        fclose(fp);
    }
    printf("  Minor faults after: %lu (new: %lu for %zu pages)\n\n", fa, fa - fb, msz / 4096);
    printf("  mmap() only creates virtual mappings. Physical frames allocated on first access.\n\n");
    munmap(m, msz);
    log_event("CO-4: Page fault demo (new faults=%lu)", fa - fb);
}

void mm_show_address_space_layout(void) {
    int sv = 42; static int dv = 100; int *hv = malloc(sizeof(int)); *hv = 200;
    printf("\n  === CO-4: PROCESS ADDRESS SPACE LAYOUT ===\n\n");
    printf("  High Addr  +------------------+\n");
    printf("             |   Kernel Space   | (not accessible)\n");
    printf("             +------------------+\n");
    printf("             |     Stack  v     | local vars\n");
    printf("             +------------------+\n");
    printf("             |   mmap region    | shared libs\n");
    printf("             +------------------+\n");
    printf("             |     Heap  ^      | malloc\n");
    printf("             +------------------+\n");
    printf("             |   BSS / Data     | globals\n");
    printf("             +------------------+\n");
    printf("  Low Addr   |   Text (code)    | read-only\n");
    printf("             +------------------+\n\n");
    printf("  Actual addresses in PID %d:\n", getpid());
    printf("    Text(code): %p\n", (void*)mm_show_address_space_layout);
    printf("    Data(init): %p (val=%d)\n", (void*)&dv, dv);
    printf("    Heap:       %p (val=%d)\n", (void*)hv, *hv);
    printf("    Stack:      %p (val=%d)\n\n", (void*)&sv, sv);
    free(hv);
}
