#include "logger.h"

int log_init(const char *filename) {
    pthread_mutex_init(&g_ctx.log_mutex, NULL);
    g_ctx.log_fd = open(filename, O_WRONLY | O_CREAT | O_APPEND, 0644);
    if (g_ctx.log_fd == -1) { perror("open log"); return -1; }
    log_event("=== SUPERVISOR STARTED (PID=%d) ===", getpid());
    return 0;
}

void log_cleanup(void) {
    log_event("=== SUPERVISOR SHUTDOWN ===");
    if (g_ctx.log_fd != -1) { close(g_ctx.log_fd); g_ctx.log_fd = -1; }
    pthread_mutex_destroy(&g_ctx.log_mutex);
}

void log_event(const char *fmt, ...) {
    char timestamp[64], message[MAX_LOG_MSG], full_msg[MAX_LOG_MSG + 128];
    va_list args;
    va_start(args, fmt);
    vsnprintf(message, sizeof(message), fmt, args);
    va_end(args);
    get_timestamp(timestamp, sizeof(timestamp));
    int len = snprintf(full_msg, sizeof(full_msg), "[%s] %s\n", timestamp, message);
    pthread_mutex_lock(&g_ctx.log_mutex);
    if (g_ctx.log_fd != -1) write(g_ctx.log_fd, full_msg, len);
    pthread_mutex_unlock(&g_ctx.log_mutex);
}

void log_show_recent(int n) {
    FILE *fp = fopen(LOG_FILE, "r");
    if (!fp) { printf("  [ERROR] Cannot open log file\n"); return; }
    char line[MAX_LOG_MSG];
    int total = 0;
    while (fgets(line, sizeof(line), fp)) total++;
    rewind(fp);
    int skip = total - n;
    if (skip < 0) skip = 0;
    int current = 0;
    printf("\n  === RECENT LOG ENTRIES (last %d of %d) ===\n", n, total);
    while (fgets(line, sizeof(line), fp)) {
        if (current >= skip) printf("  %s", line);
        current++;
    }
    printf("\n");
    fclose(fp);
}
