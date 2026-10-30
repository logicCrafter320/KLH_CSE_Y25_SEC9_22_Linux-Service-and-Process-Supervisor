#ifndef IPC_MANAGER_H
#define IPC_MANAGER_H
#include "supervisor.h"
int ipc_init(void);
void ipc_cleanup(void);
int ipc_read_pipe(int id, char *buf, size_t len);
int ipc_demo_pipe_chain(void);
void ipc_setup_signal_handlers(void);
void ipc_send_signal_to_group(pid_t pgid, int sig);
void *ipc_fifo_listener_thread(void *arg);
#endif
