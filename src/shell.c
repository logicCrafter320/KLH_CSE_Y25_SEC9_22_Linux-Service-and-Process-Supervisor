#include "shell.h"
#include "logger.h"

void shell_show_architecture(void) {
    printf("\n");
    printf("  === CO-1: LINUX ARCHITECTURE & SOFTWARE STACK ===\n\n");
    printf("  +-------------------------------------------+\n");
    printf("  |         USER APPLICATIONS                 |\n");
    printf("  |  (Supervisor, Shell, Editors, etc.)       |\n");
    printf("  +-------------------+-----------------------+\n");
    printf("                      | Library calls\n");
    printf("  +-------------------v-----------------------+\n");
    printf("  |         C LIBRARY (glibc)                 |\n");
    printf("  |  printf(), malloc(), fork(), pthread_*    |\n");
    printf("  +-------------------+-----------------------+\n");
    printf("                      | System calls (trap)\n");
    printf("  ====================+========================\n");
    printf("       USER / KERNEL BOUNDARY\n");
    printf("  ====================+========================\n");
    printf("                      |\n");
    printf("  +-------------------v-----------------------+\n");
    printf("  |         LINUX KERNEL                      |\n");
    printf("  |  +----------+ +--------+ +----------+     |\n");
    printf("  |  | Process  | | Memory | |   File   |     |\n");
    printf("  |  | Manager  | | Mgr    | |  System  |     |\n");
    printf("  |  | (CO-2)   | | (CO-4) | |  (CO-5)  |     |\n");
    printf("  |  +----------+ +--------+ +----------+     |\n");
    printf("  |  +----------+ +--------+ +----------+     |\n");
    printf("  |  |   IPC    | | Sched  | | Drivers  |     |\n");
    printf("  |  |  (CO-3)  | | (CO-2) | |          |     |\n");
    printf("  |  +----------+ +--------+ +----------+     |\n");
    printf("  +-------------------+-----------------------+\n");
    printf("                      |\n");
    printf("  +-------------------v-----------------------+\n");
    printf("  |         HARDWARE                          |\n");
    printf("  |  CPU, RAM, Disk, Network, I/O             |\n");
    printf("  +-------------------------------------------+\n\n");
}

void shell_show_syscall_journey(void) {
    printf("\n  === CO-1: COMMAND EXECUTION JOURNEY ===\n\n");
    printf("  User types: 'sleep 300'\n\n");
    printf("  1. [USER] Supervisor calls fork()\n");
    printf("     -> syscall instruction -> User to Kernel mode switch\n\n");
    printf("  2. [KERNEL] sys_fork():\n");
    printf("     -> Allocate task_struct\n");
    printf("     -> Copy page tables (COW - CO-4)\n");
    printf("     -> Assign new PID\n");
    printf("     -> Return: parent gets PID, child gets 0\n\n");
    printf("  3. [USER-CHILD] Child calls execvp('sleep')\n");
    printf("     -> syscall instruction -> Kernel mode\n\n");
    printf("  4. [KERNEL] sys_execve():\n");
    printf("     -> Find 'sleep' binary via PATH\n");
    printf("     -> Read ELF header\n");
    printf("     -> Create new address space (text/data/stack)\n");
    printf("     -> Jump to program entry point\n\n");
    printf("  5. [USER] 'sleep 300' now running\n");
    printf("     -> Parent monitors via waitpid() (CO-2)\n");
    printf("     -> Parent reads /proc/<PID> (CO-5)\n\n");
}

void shell_run_mini_shell(void) {
    printf("\n  === CO-1: MINI SHELL ===\n");
    printf("  Type commands (e.g. 'ls', 'whoami', 'pwd', 'uname -a'). Type 'exit' to return.\n\n");
    
    char input[MAX_CMD_LEN];
    while (1) {
        printf("  sup-shell$ ");
        fflush(stdout);

        if (!fgets(input, sizeof(input), stdin)) break;

        /* Strip both \r and \n (fixes WSL2 cursor jumping) */
        input[strcspn(input, "\r\n")] = '\0';

        /* Skip leading spaces */
        char *cmd_ptr = input;
        while (*cmd_ptr == ' ' || *cmd_ptr == '\t') cmd_ptr++;

        if (strlen(cmd_ptr) == 0) continue;
        if (strcmp(cmd_ptr, "exit") == 0) break;

        /* Parse tokens safely */
        char *argv[MAX_ARGS];
        int argc = 0;
        char *tok = strtok(cmd_ptr, " \t");
        while (tok && argc < MAX_ARGS - 1) {
            argv[argc++] = tok;
            tok = strtok(NULL, " \t");
        }
        argv[argc] = NULL;

        if (argc == 0) continue;

        pid_t pid = fork();
        if (pid == 0) {
            execvp(argv[0], argv);
            fprintf(stderr, "  Command not found: %s\n", argv[0]);
            _exit(127);
        } else if (pid > 0) {
            int st;
            waitpid(pid, &st, 0);
        } else {
            perror("fork");
        }
    }
    printf("  Exiting mini shell.\n\n");
}
