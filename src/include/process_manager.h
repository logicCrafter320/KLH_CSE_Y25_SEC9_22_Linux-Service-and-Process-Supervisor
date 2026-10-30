#ifndef PROCESS_MANAGER_H
#define PROCESS_MANAGER_H
#include "supervisor.h"

int pm_init(void);
void pm_cleanup(void);
int pm_start_process(const char *name, const char *command, int priority);
int pm_stop_process(int id);
int pm_pause_process(int id);
int pm_resume_process(int id);
int pm_terminate_process(int id);
ManagedProcess *pm_find_by_id(int id);
ManagedProcess *pm_find_by_pid(pid_t pid);
void pm_check_all_processes(void);
void pm_show_status(void);
void pm_show_process_details(int id);
int pm_restart_process(int id);
void pm_shutdown_all(void);
void pm_show_state_diagram(void);
void *pm_watchdog_thread(void *arg);
void pm_export_json_status(void);

#endif
