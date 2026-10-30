CC       = gcc
CFLAGS   = -Wall -Wextra -Wno-unused-parameter -g -Iinclude
LDFLAGS  = -lpthread -lrt

SRC_DIR  = src
BUILD_DIR = build

SOURCES  = $(SRC_DIR)/main.c \
           $(SRC_DIR)/process_manager.c \
           $(SRC_DIR)/proc_monitor.c \
           $(SRC_DIR)/logger.c \
           $(SRC_DIR)/config.c \
           $(SRC_DIR)/ipc_manager.c \
           $(SRC_DIR)/memory_monitor.c \
           $(SRC_DIR)/filesystem_monitor.c \
           $(SRC_DIR)/thread_pool.c \
           $(SRC_DIR)/scheduler.c \
           $(SRC_DIR)/shell.c \
           $(SRC_DIR)/web_server.c

OBJECTS  = $(SOURCES:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)
TARGET   = supervisor

all: $(BUILD_DIR) $(TARGET)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(TARGET): $(OBJECTS)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -rf $(BUILD_DIR) $(TARGET) supervisor.log /tmp/sup_* /tmp/supervisor_fifo

run: all
	./$(TARGET)
