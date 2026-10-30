#ifndef SCHEDULER_H
#define SCHEDULER_H
#include "supervisor.h"
int sched_init(SchedPolicy policy);
void sched_set_policy(SchedPolicy policy);
void sched_show_ready_queue(void);
void sched_demo_scheduling(void);
int sched_select_next(void);
#endif
