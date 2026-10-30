#ifndef FILESYSTEM_MONITOR_H
#define FILESYSTEM_MONITOR_H
#include "supervisor.h"
int fs_init(void);
void fs_cleanup(void);
void fs_show_open_fds(pid_t pid);
void fs_show_fd_table(void);
void fs_show_inode_info(const char *path);
void fs_demo_buffered_vs_unbuffered(void);
void fs_demo_mmap_io(void);
void fs_explore_proc_vfs(pid_t pid);
int fs_mmap_config(const char *path);
void fs_unmap_config(void);
#endif
