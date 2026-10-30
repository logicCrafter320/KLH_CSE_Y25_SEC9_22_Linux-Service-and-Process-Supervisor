#include "web_server.h"
#include "process_manager.h"
#include "logger.h"
#include "memory_monitor.h"
#include <sys/socket.h>
#include <netinet/in.h>

static int g_web_server_fd = -1;
static pthread_t g_web_thread;

static const char *HTML_PAGE = 
"<!DOCTYPE html>"
"<html><head><meta charset='UTF-8'>"
"<title>Linux Process Supervisor | C Web Console</title>"
"<style>"
"body{font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;padding:20px;margin:0;}"
".container{max-width:1200px;margin:0 auto;}"
"header{display:flex;justify-content:space-between;align-items:center;background:#1e293b;padding:16px 24px;border-radius:12px;border:1px solid #334155;margin-bottom:20px;}"
".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:20px;}"
".card{background:#1e293b;padding:20px;border-radius:12px;border:1px solid #334155;}"
".title{font-size:0.75rem;color:#94a3b8;text-transform:uppercase;font-weight:bold;margin-bottom:8px;}"
".val{font-size:2.2rem;font-weight:800;font-family:monospace;}"
"table{width:100%;border-collapse:collapse;margin-top:10px;}"
"th{text-align:left;padding:10px;font-size:0.8rem;color:#94a3b8;border-bottom:1px solid #334155;text-transform:uppercase;}"
"td{padding:12px 10px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.9rem;}"
".btn{padding:6px 12px;border-radius:6px;border:none;font-weight:bold;cursor:pointer;font-size:0.8rem;margin-right:4px;}"
".btn-stop{background:#ef4444;color:#fff;}"
".btn-pause{background:#f59e0b;color:#000;}"
".btn-resume{background:#10b981;color:#fff;}"
".badge{padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:bold;font-family:monospace;}"
".RUNNING{background:rgba(16,185,129,0.2);color:#10b981;}"
".PAUSED{background:rgba(245,158,11,0.2);color:#f59e0b;}"
".STOPPED,.EXITED{background:rgba(148,163,184,0.2);color:#94a3b8;}"
".FAILED{background:rgba(239,68,68,0.2);color:#ef4444;}"
"</style></head><body>"
"<div class='container'>"
"<header><div><h1>Linux Process Supervisor</h1><p style='color:#94a3b8;font-size:0.85rem;'>Native C Multithreaded HTTP Web Console (CO-1 to CO-6)</p></div>"
"<div style='background:rgba(16,185,129,0.2);color:#10b981;padding:6px 14px;border-radius:20px;font-weight:bold;font-size:0.85rem;border:1px solid #10b981;'>C SOCKET SERVER ACTIVE</div></header>"
"<div class='grid'>"
"<div class='card'><div class='title'>Running Processes</div><div class='val' style='color:#10b981;' id='run-cnt'>0</div></div>"
"<div class='card'><div class='title'>Paused (SIGSTOP)</div><div class='val' style='color:#f59e0b;' id='pause-cnt'>0</div></div>"
"<div class='card'><div class='title'>Auto-Recovered Crashes</div><div class='val' style='color:#ef4444;' id='crash-cnt'>0</div></div>"
"<div class='card'><div class='title'>Supervisor PID</div><div class='val' style='color:#3b82f6;' id='sup-pid'>-</div></div>"
"</div>"
"<div class='card'>"
"<div style='display:flex;justify-content:space-between;align-items:center;'>"
"<h3>Managed Process Control Table</h3><span style='color:#94a3b8;font-size:0.8rem;'>Auto-refreshing every 2s...</span>"
"</div>"
"<table><thead><tr><th>ID</th><th>Name</th><th>PID</th><th>State</th><th>Priority</th><th>Restarts</th><th>RSS Memory</th><th>Threads</th><th>Actions</th></tr></thead>"
"<tbody id='tb'><tr><td colspan='9' style='text-align:center;color:#94a3b8;'>Loading...</td></tr></tbody></table>"
"</div></div>"
"<script>"
"async function update(){"
"  try{"
"    const r = await fetch('/api/status');"
"    const d = await res = r.json();"
"    document.getElementById('sup-pid').textContent = d.supervisor_pid;"
"    document.getElementById('run-cnt').textContent = d.running_count;"
"    document.getElementById('pause-cnt').textContent = d.paused_count;"
"    document.getElementById('crash-cnt').textContent = d.total_restarts;"
"    const tb = document.getElementById('tb');"
"    if(!d.processes || d.processes.length===0){"
"      tb.innerHTML='<tr><td colspan=\"9\" style=\"text-align:center;color:#94a3b8;\">No processes running. Start a process from terminal.</td></tr>';"
"      return;"
"    }"
"    tb.innerHTML = d.processes.map(p=>'<tr>'+"
"      '<td><b>#'+p.id+'</b></td>'+"
"      '<td><b>'+p.name+'</b><br><small style=\"color:#94a3b8;\">'+p.command+'</small></td>'+"
"      '<td><code>'+p.pid+'</code></td>'+"
"      '<td><span class=\"badge '+p.state+'\">'+p.state+'</span></td>'+"
"      '<td>'+p.priority+'</td>'+"
"      '<td><b>'+p.restart_count+'</b></td>'+"
"      '<td>'+Math.round(p.vm_rss_kb/1024)+' MB</td>'+"
"      '<td>'+p.threads+'</td>'+"
"      '<td>'+"
"        (p.state==='RUNNING'?'<button class=\"btn btn-pause\" onclick=\"act(\\'pause\\','+p.id+')\">Pause</button>':'')+"
"        (p.state==='PAUSED'?'<button class=\"btn btn-resume\" onclick=\"act(\\'resume\\','+p.id+')\">Resume</button>':'')+"
"        (p.state==='RUNNING'||p.state==='PAUSED'?'<button class=\"btn btn-stop\" onclick=\"act(\\'stop\\','+p.id+')\">Stop</button>':'')+"
"        '<button class=\"btn btn-stop\" onclick=\"act(\\'kill\\','+p.id+')\">Kill</button>'+"
"      '</td></tr>').join('');"
"  }catch(e){}"
"}"
"async function act(a,id){ await fetch('/api/action?type='+a+'&id='+id); setTimeout(update,200); }"
"update(); setInterval(update, 2000);"
"</script></body></html>";

static void send_http_response(int client_fd, const char *header, const char *body) {
    char response[16384];
    int len = snprintf(response, sizeof(response),
                       "HTTP/1.1 200 OK\r\n"
                       "Content-Type: %s\r\n"
                       "Access-Control-Allow-Origin: *\r\n"
                       "Content-Length: %zu\r\n"
                       "Connection: close\r\n\r\n"
                       "%s",
                       header, strlen(body), body);
    write(client_fd, response, len);
}

static void build_json_status(char *json_buf, size_t max_len) {
    pthread_rwlock_rdlock(&g_ctx.proc_rwlock);

    int running = 0, paused = 0, failed = 0, restarts = 0;
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *p = &g_ctx.processes[i];
        if (!p->active) continue;
        if (p->state == STATE_RUNNING) running++;
        else if (p->state == STATE_PAUSED) paused++;
        else if (p->state == STATE_FAILED) failed++;
        restarts += p->restart_count;
    }

    int offset = snprintf(json_buf, max_len,
        "{"
        "\"supervisor_pid\":%d,"
        "\"running_count\":%d,"
        "\"paused_count\":%d,"
        "\"failed_count\":%d,"
        "\"total_restarts\":%d,"
        "\"processes\":[",
        g_ctx.supervisor_pid, running, paused, failed, restarts);

    int first = 1;
    for (int i = 0; i < MAX_PROCESSES; i++) {
        ManagedProcess *p = &g_ctx.processes[i];
        if (!p->active) continue;

        if (p->state == STATE_RUNNING || p->state == STATE_PAUSED) {
            mm_update_process_memory(p);
        }

        if (!first) offset += snprintf(json_buf + offset, max_len - offset, ",");
        first = 0;

        offset += snprintf(json_buf + offset, max_len - offset,
            "{"
            "\"id\":%d,"
            "\"name\":\"%s\","
            "\"command\":\"%s\","
            "\"pid\":%d,"
            "\"state\":\"%s\","
            "\"priority\":%d,"
            "\"restart_count\":%d,"
            "\"vm_rss_kb\":%lu,"
            "\"threads\":%d"
            "}",
            p->id, p->name, p->command, p->pid,
            state_to_string(p->state), p->priority, p->restart_count,
            p->vm_rss_kb, p->num_threads);
    }

    snprintf(json_buf + offset, max_len - offset, "]}");
    pthread_rwlock_unlock(&g_ctx.proc_rwlock);
}

void *web_server_thread(void *arg) {
    (void)arg;
    char buffer[4096];

    while (g_ctx.running) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(g_web_server_fd, (struct sockaddr *)&client_addr, &client_len);

        if (client_fd < 0) {
            usleep(50000);
            continue;
        }

        ssize_t bytes_read = read(client_fd, buffer, sizeof(buffer) - 1);
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';

            if (strstr(buffer, "GET /api/status")) {
                char json_response[8192];
                build_json_status(json_response, sizeof(json_response));
                send_http_response(client_fd, "application/json", json_response);
            } else if (strstr(buffer, "GET /api/action")) {
                /* Parse action query params: /api/action?type=pause&id=1 */
                char *type_ptr = strstr(buffer, "type=");
                char *id_ptr = strstr(buffer, "id=");
                if (type_ptr && id_ptr) {
                    char type[16] = {0};
                    int id = atoi(id_ptr + 3);
                    sscanf(type_ptr + 5, "%15[^& ]", type);

                    if (strcmp(type, "stop") == 0) pm_stop_process(id);
                    else if (strcmp(type, "pause") == 0) pm_pause_process(id);
                    else if (strcmp(type, "resume") == 0) pm_resume_process(id);
                    else if (strcmp(type, "kill") == 0) pm_terminate_process(id);
                }
                send_http_response(client_fd, "application/json", "{\"status\":\"ok\"}");
            } else {
                /* Serve Embedded HTML Page */
                send_http_response(client_fd, "text/html", HTML_PAGE);
            }
        }
        close(client_fd);
    }
    return NULL;
}

int web_server_init(int port) {
    g_web_server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (g_web_server_fd < 0) {
        log_event("WARNING: Could not create web server socket");
        return -1;
    }

    int opt = 1;
    setsockopt(g_web_server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port);

    if (bind(g_web_server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        log_event("WARNING: Could not bind web server to port %d", port);
        close(g_web_server_fd);
        return -1;
    }

    if (listen(g_web_server_fd, 10) < 0) {
        log_event("WARNING: Could not listen on web server socket");
        close(g_web_server_fd);
        return -1;
    }

    pthread_create(&g_web_thread, NULL, web_server_thread, NULL);
    log_event("CO-3: Native C Web Server started on port %d", port);
    printf("  [WEB CONSOLE] Native C Web Server running at: http://localhost:%d\n", port);
    return 0;
}

void web_server_cleanup(void) {
    if (g_web_server_fd >= 0) {
        close(g_web_server_fd);
        g_web_server_fd = -1;
    }
}
