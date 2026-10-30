#include "proc_monitor.h"
#include "logger.h"
#include "process_manager.h"
#include "memory_monitor.h"

int procmon_read_status(pid_t pid) {
    char path[MAX_PATH_LEN], line[512];
    snprintf(path, sizeof(path), "/proc/%d/status", pid);
    FILE *fp = fopen(path, "r");
    if (!fp) { printf("  [ERROR] Process %d not in /proc\n", pid); return -1; }
    printf("\n  === /proc/%d/status ===\n", pid);
    while (fgets(line, sizeof(line), fp)) {
        if (strncmp(line, "Name:", 5) == 0 || strncmp(line, "State:", 6) == 0 ||
            strncmp(line, "Pid:", 4) == 0  || strncmp(line, "PPid:", 5) == 0 ||
            strncmp(line, "VmSize:", 7) == 0 || strncmp(line, "VmRSS:", 6) == 0 ||
            strncmp(line, "Threads:", 8) == 0) {
            printf("  %s", line);
        }
    }
    printf("\n");
    fclose(fp);
    return 0;
}

void procmon_continuous_monitor(void) {
    printf("\n  Continuous monitoring. Press 'q' + Enter to stop.\n\n");
    int flags = fcntl(STDIN_FILENO, F_GETFL);
    fcntl(STDIN_FILENO, F_SETFL, flags | O_NONBLOCK);
    while (1) {
        pm_check_all_processes();
        printf("\033[2J\033[H");
        printf("  === CONTINUOUS MONITOR ('q' + Enter to stop) ===\n\n");
        pm_show_status();
        mm_show_dashboard();
        char c;
        if (read(STDIN_FILENO, &c, 1) > 0 && c == 'q') break;
        sleep(MONITOR_INTERVAL);
    }
    fcntl(STDIN_FILENO, F_SETFL, flags);
    printf("\n  Continuous monitoring stopped.\n");
}
