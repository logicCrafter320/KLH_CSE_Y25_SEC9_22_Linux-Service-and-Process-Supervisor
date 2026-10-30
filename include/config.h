#ifndef CONFIG_H
#define CONFIG_H
#include "supervisor.h"
typedef struct {
    char name[MAX_NAME_LEN];
    char command[MAX_CMD_LEN];
    int priority;
} ServiceConfig;
#define MAX_SERVICES 32
extern ServiceConfig g_services[];
extern int g_service_count;
int config_load(const char *filename);
void config_show(void);
#endif
