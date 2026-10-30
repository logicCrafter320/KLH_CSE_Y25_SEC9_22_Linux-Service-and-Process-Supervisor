#ifndef PROC_MONITOR_H
#define PROC_MONITOR_H
#include "supervisor.h"
int procmon_read_status(pid_t pid);
void procmon_continuous_monitor(void);
#endif
