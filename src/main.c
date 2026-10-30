#include "supervisor.h"
#include "process_manager.h"
#include "proc_monitor.h"
#include "logger.h"
#include "config.h"
#include "ipc_manager.h"
#include "memory_monitor.h"
#include "filesystem_monitor.h"
#include "thread_pool.h"
#include "scheduler.h"
#include "shell.h"
#include "web_server.h"

SupervisorContext g_ctx;

static void monitor_task(void *arg) {
    int id = *(int *)arg;
    ManagedProcess *proc = pm_find_by_id(id);
    if (proc && proc->active) {
        mm_update_process_memory(proc);
        log_event("CO-6: Thread pool updated PID=%d", proc->pid);
    }
    free(arg);
}

static void show_menu(void) {
    printf("\n");
    printf("  +=============================================================+\n");
    printf("  |       LINUX PROCESS & SERVICE SUPERVISOR v2.0               |\n");
    printf("  |                   (CO-1 to CO-6)                            |\n");
    printf("  +=============================================================+\n");
    printf("  | PROCESS (CO-2)         | MEMORY (CO-4)                      |\n");
    printf("  |  1. Start from Config  | 19. Memory Map (/proc/maps)        |\n");
    printf("  |  2. Start Custom Cmd   | 20. System Memory (/proc/meminfo)  |\n");
    printf("  |  3. Stop (SIGTERM)     | 21. Shared Dashboard (shm_open)    |\n");
    printf("  |  4. Pause (SIGSTOP)    | 22. Copy-on-Write Demo             |\n");
    printf("  |  5. Resume (SIGCONT)   | 23. Page Fault Demo                |\n");
    printf("  |  6. Terminate (SIGKILL)| 24. Process Address Layout         |\n");
    printf("  |  7. Show Status Table  |------------------------------------|\n");
    printf("  |  8. Process Details    | FILE SYSTEM (CO-5)                 |\n");
    printf("  |  9. State FSM Diagram  | 25. Open File Descriptors (FDs)    |\n");
    printf("  |------------------------| 26. Inode & File Information       |\n");
    printf("  | MONITORING (CO-2/CO-5) | 27. Buffered vs Unbuffered I/O     |\n");
    printf("  | 10. /proc Status Read  | 28. Memory-Mapped I/O Demo         |\n");
    printf("  | 11. Continuous Monitor | 29. Explore /proc VFS Entries      |\n");
    printf("  | 12. Thread Pool Update |------------------------------------|\n");
    printf("  |------------------------| CONCURRENCY (CO-6)                 |\n");
    printf("  | ARCHITECTURE (CO-1)    | 30. Race Condition Demo            |\n");
    printf("  | 13. Linux Stack Diagram| 31. Producer-Consumer Bounded Buf  |\n");
    printf("  | 14. Syscall Journey    | 32. Semaphore Resource Demo        |\n");
    printf("  | 15. Mini Shell         | 33. Deadlock Avoidance Demo        |\n");
    printf("  |------------------------|------------------------------------|\n");
    printf("  | IPC (CO-3)             | SCHEDULER & OTHER (CO-2/CO-5)      |\n");
    printf("  | 16. Read Pipe Output   | 34. Set Scheduler Policy           |\n");
    printf("  | 17. Pipe Chain (cmd|cmd| 35. Show Ready Queue               |\n");
    printf("  | 18. Signal Proc Group  | 36. Scheduling Demo                |\n");
    printf("  |                        | 37. Show Config | 38. View Logs    |\n");
    printf("  |                        | 39. View FD Table | 40. Safe Exit  |\n");
    printf("  +=============================================================+\n");
    printf("\n  Enter choice: ");
    fflush(stdout);
}

int main(void) {
    memset(&g_ctx, 0, sizeof(g_ctx));
    g_ctx.running = 1;
    g_ctx.supervisor_pid = getpid();
    g_ctx.supervisor_pgid = getpgrp();
    g_ctx.shm_fd = -1;
    g_ctx.log_fd = -1;

    log_init(LOG_FILE);
    pm_init();
    ipc_init();
    mm_init();
    fs_init();
    sched_init(SCHED_PRIORITY);
    g_ctx.thread_pool = tp_create(THREAD_POOL_SIZE);
    config_load(CONFIG_FILE);

    pthread_t fifo_th;
    pthread_create(&fifo_th, NULL, ipc_fifo_listener_thread, NULL);
    pthread_detach(fifo_th);

    pthread_t watchdog_th;
    pthread_create(&watchdog_th, NULL, pm_watchdog_thread, NULL);
    pthread_detach(watchdog_th);

    /* Start Pure C Native Web Server on Port 8080 */
    web_server_init(8080);

    log_event("Supervisor started — PID=%d", g_ctx.supervisor_pid);

    char buf[64];
    while (g_ctx.running) {
        show_menu();
        if (!fgets(buf, sizeof(buf), stdin)) break;
        int choice = atoi(buf);

        switch (choice) {
            case 1:
                config_show();
                printf("  Enter service # (1-%d): ", g_service_count);
                fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) {
                    int s = atoi(buf) - 1;
                    if (s >= 0 && s < g_service_count)
                        pm_start_process(g_services[s].name, g_services[s].command, g_services[s].priority);
                }
                break;
            case 2: {
                char nm[MAX_NAME_LEN], cmd[MAX_CMD_LEN];
                printf("  Name: "); fflush(stdout); if (!fgets(nm, sizeof(nm), stdin)) break;
                nm[strcspn(nm, "\r\n")] = 0;
                printf("  Command: "); fflush(stdout); if (!fgets(cmd, sizeof(cmd), stdin)) break;
                cmd[strcspn(cmd, "\r\n")] = 0;
                printf("  Priority (1-10): "); fflush(stdout);
                int p = 5; if (fgets(buf, sizeof(buf), stdin)) p = atoi(buf);
                pm_start_process(nm, cmd, p);
                break;
            }
            case 3:
                pm_show_status(); printf("  ID to stop: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) pm_stop_process(atoi(buf));
                break;
            case 4:
                pm_show_status(); printf("  ID to pause: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) pm_pause_process(atoi(buf));
                break;
            case 5:
                pm_show_status(); printf("  ID to resume: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) pm_resume_process(atoi(buf));
                break;
            case 6:
                pm_show_status(); printf("  ID to terminate: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) pm_terminate_process(atoi(buf));
                break;
            case 7:  pm_show_status(); break;
            case 8:
                pm_show_status(); printf("  ID: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) pm_show_process_details(atoi(buf));
                break;
            case 9:  pm_show_state_diagram(); break;
            case 10:
                pm_show_status(); printf("  ID: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) {
                    ManagedProcess *p = pm_find_by_id(atoi(buf));
                    if (p && p->active) procmon_read_status(p->pid);
                }
                break;
            case 11: procmon_continuous_monitor(); break;
            case 12:
                for (int i = 0; i < MAX_PROCESSES; i++) {
                    if (g_ctx.processes[i].active && g_ctx.processes[i].state == STATE_RUNNING) {
                        int *id_ptr = malloc(sizeof(int));
                        *id_ptr = g_ctx.processes[i].id;
                        tp_submit(g_ctx.thread_pool, monitor_task, id_ptr);
                    }
                }
                tp_wait_all(g_ctx.thread_pool);
                pm_show_status();
                break;
            case 13: shell_show_architecture(); break;
            case 14: shell_show_syscall_journey(); break;
            case 15: shell_run_mini_shell(); break;
            case 16:
                pm_show_status(); printf("  ID: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) {
                    char pbuf[PIPE_BUF_SIZE];
                    int bytes = ipc_read_pipe(atoi(buf), pbuf, sizeof(pbuf));
                    if (bytes > 0) printf("  Output (%d B):\n%s\n", bytes, pbuf);
                    else printf("  No pipe data available.\n");
                }
                break;
            case 17: ipc_demo_pipe_chain(); break;
            case 18:
                pm_show_status(); printf("  ID: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) {
                    ManagedProcess *p = pm_find_by_id(atoi(buf));
                    if (p && p->active) ipc_send_signal_to_group(p->pgid, SIGTERM);
                }
                break;
            case 19:
                pm_show_status(); printf("  ID: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) {
                    ManagedProcess *p = pm_find_by_id(atoi(buf));
                    if (p && p->active) mm_show_process_memory_map(p->pid);
                }
                break;
            case 20: mm_show_system_memory(); break;
            case 21: mm_show_dashboard(); break;
            case 22: mm_demo_cow(); break;
            case 23: mm_demo_page_faults(); break;
            case 24: mm_show_address_space_layout(); break;
            case 25:
                pm_show_status(); printf("  ID (0 for supervisor): "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) {
                    int id = atoi(buf);
                    if (id == 0) fs_show_open_fds(getpid());
                    else {
                        ManagedProcess *p = pm_find_by_id(id);
                        if (p && p->active) fs_show_open_fds(p->pid);
                    }
                }
                break;
            case 26: {
                char pth[MAX_PATH_LEN]; printf("  Path: "); fflush(stdout);
                if (fgets(pth, sizeof(pth), stdin)) {
                    pth[strcspn(pth, "\r\n")] = 0;
                    fs_show_inode_info(pth);
                }
                break;
            }
            case 27: fs_demo_buffered_vs_unbuffered(); break;
            case 28: fs_demo_mmap_io(); break;
            case 29:
                pm_show_status(); printf("  ID: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) {
                    ManagedProcess *p = pm_find_by_id(atoi(buf));
                    if (p && p->active) fs_explore_proc_vfs(p->pid);
                }
                break;
            case 30: tp_demo_race_condition(); break;
            case 31: tp_demo_producer_consumer(); break;
            case 32: tp_demo_semaphore(); break;
            case 33: tp_demo_deadlock_avoidance(); break;
            case 34:
                printf("  1. FCFS  2. RR  3. Priority\n  Choice: "); fflush(stdout);
                if (fgets(buf, sizeof(buf), stdin)) {
                    int p = atoi(buf);
                    if (p >= 1 && p <= 3) sched_set_policy((SchedPolicy)(p - 1));
                }
                break;
            case 35: sched_show_ready_queue(); break;
            case 36: sched_demo_scheduling(); break;
            case 37: config_show(); break;
            case 38: log_show_recent(20); break;
            case 39: fs_show_fd_table(); break;
            case 40: g_ctx.running = 0; break;
            default: printf("  Invalid option.\n"); break;
        }
    }

    printf("\n  Shutting down...\n");
    web_server_cleanup();
    pm_shutdown_all();
    tp_destroy(g_ctx.thread_pool);
    ipc_cleanup();
    mm_cleanup();
    fs_cleanup();
    pm_cleanup();
    log_cleanup();
    printf("  Supervisor exited safely.\n");
    return 0;
}
