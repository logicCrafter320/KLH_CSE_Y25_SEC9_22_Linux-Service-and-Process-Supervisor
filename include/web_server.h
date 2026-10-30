#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include "supervisor.h"

int web_server_init(int port);
void web_server_cleanup(void);
void *web_server_thread(void *arg);

#endif
