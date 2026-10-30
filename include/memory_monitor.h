#ifndef MEMORY_MONITOR_H
#define MEMORY_MONITOR_H
#include "supervisor.h"
int mm_init(void);
void mm_cleanup(void);
int mm_update_process_memory(ManagedProcess *proc);
void mm_show_process_memory_map(pid_t pid);
void mm_show_system_memory(void);
int mm_create_shared_dashboard(void);
void mm_destroy_shared_dashboard(void);
void mm_update_dashboard(void);
void mm_show_dashboard(void);
void mm_demo_cow(void);
void mm_demo_page_faults(void);
void mm_show_address_space_layout(void);
#endif
