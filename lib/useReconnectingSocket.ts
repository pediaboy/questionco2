"use client";

import { useEffect, useRef, useState } from "react";

export type SocketStatus = "connecting" | "online" | "offline";

/**
 * Shared WebSocket hook with exponential-backoff auto-reconnect, used by both
 * the live price ticker and the order book panel. Reconnects automatically if
 * the connection drops, and resubscribes on every fresh connect.
 */
export function useReconnectingSocket(
  url: string,
  onMessage: (data: unknown) => void,
  opts?: { subscribe?: Record<string, unknown> }
): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const subscribeRef = useRef(opts?.subscribe);
  subscribeRef.current = opts?.subscribe;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUnmount = false;

    const connect = () => {
      setStatus((s) => (s === "online" ? s : "connecting"));
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        retry = 0;
        setStatus("online");
        if (subscribeRef.current && ws) {
          ws.send(JSON.stringify(subscribeRef.current));
        }
      };

      ws.onmessage = (evt) => {
        try {
          onMessageRef.current(JSON.parse(evt.data));
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onclose = () => {
        if (closedByUnmount) return;
        setStatus("offline");
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (closedByUnmount) return;
      const delay = Math.min(1000 * 2 ** retry, 10_000);
      retry += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      closedByUnmount = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return status;
}
