import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  event?: string;
  channel?: string;
  data?: any;
  alert?: any;
  timestamp?: string;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  channel?: "alerts" | "tracking" | string;
  onMessage?: (data: WebSocketMessage) => void;
  autoReconnect?: boolean;
  heartbeatIntervalMs?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    channel = "alerts",
    onMessage,
    autoReconnect = true,
    heartbeatIntervalMs = 30000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const getWsUrl = useCallback(() => {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    // Convert http(s) to ws(s)
    let wsHost = rawApiUrl.replace(/^http/, "ws");
    // Ensure clean path
    if (wsHost.endsWith("/api/v1")) {
      return `${wsHost}/ws/${channel}`;
    }
    return `${wsHost}/api/v1/ws/${channel}`;
  }, [channel]);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || isUnmountedRef.current) return;

    // Prevent duplicate connections
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);

        // Heartbeat ping
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, heartbeatIntervalMs);
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        const raw = event.data;
        if (raw === "pong") return; // Heartbeat response

        try {
          const parsed = JSON.parse(raw);
          setLastMessage(parsed);
          if (onMessageRef.current) {
            onMessageRef.current(parsed);
          }
        } catch {
          // Plain text message
          const msg = { event: "MESSAGE", data: raw };
          setLastMessage(msg);
          if (onMessageRef.current) {
            onMessageRef.current(msg);
          }
        }
      };

      ws.onclose = () => {
        if (isUnmountedRef.current) return;
        setIsConnected(false);
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // Offline or network unavailable
      setIsConnected(false);
      if (autoReconnect && !isUnmountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 8000);
      }
    }
  }, [autoReconnect, getWsUrl, heartbeatIntervalMs]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: string | object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof msg === "string" ? msg : JSON.stringify(msg);
      socketRef.current.send(payload);
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}
