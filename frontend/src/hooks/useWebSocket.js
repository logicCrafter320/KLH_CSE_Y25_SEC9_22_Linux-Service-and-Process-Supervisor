import { useState, useEffect, useCallback, useRef } from 'react';

const useWebSocket = (url, options = {}) => {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const { maxMessages = 500, autoReconnect = true } = options;

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => {
          const updated = [...prev, data];
          return updated.length > maxMessages
            ? updated.slice(-maxMessages)
            : updated;
        });
      } catch {
        setMessages(prev => {
          const updated = [...prev, { type: 'raw', data: event.data }];
          return updated.length > maxMessages
            ? updated.slice(-maxMessages)
            : updated;
        });
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (autoReconnect) {
        setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();

    return ws;
  }, [url, maxMessages, autoReconnect]);

  useEffect(() => {
    const ws = connect();
    return () => ws.close();
  }, [connect]);

  const clearMessages = () => setMessages([]);

  return { messages, connected, clearMessages };
};

export default useWebSocket;