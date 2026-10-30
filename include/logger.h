#ifndef LOGGER_H
#define LOGGER_H
#include "supervisor.h"
int log_init(const char *filename);
void log_cleanup(void);
void log_event(const char *fmt, ...);
void log_show_recent(int n);
#endif
