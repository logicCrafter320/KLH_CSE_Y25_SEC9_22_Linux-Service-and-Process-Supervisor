#include "config.h"
#include "logger.h"
#include "filesystem_monitor.h"

ServiceConfig g_services[MAX_SERVICES];
int g_service_count = 0;

int config_load(const char *filename) {
    g_service_count = 0;
    if (fs_mmap_config(filename) == 0 && g_ctx.mmap_config) {
        log_event("CO-5: Config loaded via mmap");
        const char *p = g_ctx.mmap_config;
        const char *end = p + g_ctx.mmap_config_size;
        while (p < end && g_service_count < MAX_SERVICES) {
            if (*p == '#' || *p == '\n') {
                while (p < end && *p != '\n') p++;
                if (p < end) p++;
                continue;
            }
            char line[MAX_CMD_LEN + MAX_NAME_LEN];
            int i = 0;
            while (p < end && *p != '\n' && i < (int)sizeof(line) - 1) line[i++] = *p++;
            line[i] = '\0';
            if (p < end) p++;

            char *sep1 = strchr(line, '|');
            if (!sep1) continue;
            *sep1 = '\0';
            char *name = line;
            char *rest = sep1 + 1;
            int priority = 5;
            char *sep2 = strchr(rest, '|');
            if (sep2) {
                *sep2 = '\0';
                priority = atoi(sep2 + 1);
                if (priority < 1) priority = 1;
                if (priority > 10) priority = 10;
            }
            while (*name == ' ') name++;
            char *end_name = name + strlen(name) - 1;
            while (end_name > name && *end_name == ' ') *end_name-- = '\0';
            char *cmd = rest;
            while (*cmd == ' ') cmd++;
            char *end_cmd = cmd + strlen(cmd) - 1;
            while (end_cmd > cmd && *end_cmd == ' ') *end_cmd-- = '\0';

            if (strlen(name) > 0 && strlen(cmd) > 0) {
                strncpy(g_services[g_service_count].name, name, MAX_NAME_LEN - 1);
                strncpy(g_services[g_service_count].command, cmd, MAX_CMD_LEN - 1);
                g_services[g_service_count].priority = priority;
                g_service_count++;
                log_event("CONFIG: Loaded '%s' -> '%s' (Pri=%d)", name, cmd, priority);
            }
        }
        fs_unmap_config();
    } else {
        FILE *fp = fopen(filename, "r");
        if (!fp) { log_event("WARNING: Cannot open config '%s'", filename); return -1; }
        char line[MAX_CMD_LEN + MAX_NAME_LEN];
        while (fgets(line, sizeof(line), fp) && g_service_count < MAX_SERVICES) {
            line[strcspn(line, "\n")] = 0;
            if (line[0] == '#' || line[0] == '\0') continue;
            char *sep1 = strchr(line, '|');
            if (!sep1) continue;
            *sep1 = '\0';
            int priority = 5;
            char *sep2 = strchr(sep1 + 1, '|');
            if (sep2) { *sep2 = '\0'; priority = atoi(sep2 + 1); }
            strncpy(g_services[g_service_count].name, line, MAX_NAME_LEN - 1);
            strncpy(g_services[g_service_count].command, sep1 + 1, MAX_CMD_LEN - 1);
            g_services[g_service_count].priority = priority;
            g_service_count++;
        }
        fclose(fp);
    }
    log_event("CONFIG: %d services loaded from '%s'", g_service_count, filename);
    return g_service_count;
}

void config_show(void) {
    printf("\n  === CONFIGURATION (services.conf) ===\n");
    printf("  #   Service Name       Command              Priority\n");
    printf("  -----------------------------------------------------\n");
    for (int i = 0; i < g_service_count; i++) {
        printf("  %-2d  %-18s %-20s    %2d\n",
               i + 1, g_services[i].name, g_services[i].command, g_services[i].priority);
    }
    if (g_service_count == 0) printf("  No services configured\n");
    printf("\n");
}
