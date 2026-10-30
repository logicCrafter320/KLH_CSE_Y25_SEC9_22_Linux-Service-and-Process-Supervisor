#include "scheduler.h"
#include "logger.h"

int sched_init(SchedPolicy policy) {
    g_ctx.sched_policy = policy;
    log_event("CO-2: Scheduler init (%s)",
              policy == SCHED_FCFS ? "FCFS" : policy == SCHED_ROUND_ROBIN ? "RR" : "Priority");
    return 0;
}

void sched_set_policy(SchedPolicy policy) {
    g_ctx.sched_policy = policy;
    printf("  Policy set to: %s\n",
           policy == SCHED_FCFS ? "FCFS" : policy == SCHED_ROUND_ROBIN ? "Round Robin" : "Priority");
}

void sched_show_ready_queue(void) {
    printf("\n  === CO-2: READY QUEUE ===\n");
    printf("  Policy: %s\n",
           g_ctx.sched_policy == SCHED_FCFS ? "FCFS" :
           g_ctx.sched_policy == SCHED_ROUND_ROBIN ? "Round Robin" : "Priority");
    printf("  Pos  ID  Name                Priority\n");
    printf("  ----------------------------------------\n");
    int n = 0;
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *p = &g_ctx.processes[i];
        if (p->active && (p->state == STATE_RUNNING || p->state == STATE_READY)) {
            printf("  [%d]  %2d  %-18s    %d\n", ++n, p->id, p->name, p->priority);
        }
    }
    if (n == 0) printf("  (empty)\n");
    printf("\n");
}

int sched_select_next(void) {
    int sel = -1, best = -1;
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *p = &g_ctx.processes[i];
        if (!p->active || p->state != STATE_RUNNING) continue;
        if (g_ctx.sched_policy == SCHED_PRIORITY) {
            if (p->priority > best) { best = p->priority; sel = p->id; }
        } else {
            if (sel == -1) sel = p->id;
        }
    }
    return sel;
}

void sched_demo_scheduling(void) {
    printf("\n  === CO-2: SCHEDULING CONCEPTS ===\n\n");
    printf("  FCFS:    First Come First Served (non-preemptive)\n");
    printf("  RR:      Round Robin (time quantum, preemptive)\n");
    printf("  Priority: Highest priority runs first\n\n");
    sched_show_ready_queue();
    int nx = sched_select_next();
    if (nx != -1) printf("  Next to schedule: ID=%d\n\n", nx);
}
