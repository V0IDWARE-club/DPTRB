type SocketListener = (data: any) => void;

function getWebSocketUrl(): string {
  const envWsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (envWsUrl) {
    const clean = envWsUrl.replace(/\/+$/, "");
    return clean.endsWith("/ws") ? clean : `${clean}/ws`;
  }

  const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envApiUrl) {
    // Convert http(s) to ws(s) and strip /api suffix
    const wsBase = envApiUrl
      .replace(/^http:\/\//i, "ws://")
      .replace(/^https:\/\//i, "wss://")
      .replace(/\/+$/, "")
      .replace(/\/api$/i, "");
    return `${wsBase}/ws`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
}

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketListener>> = new Map();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isExplicitlyClosed = false;

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    const url = getWebSocketUrl();

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("⚡ [VOIDWARE WS] Connected to reaction neural network.");
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Heartbeat
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          if (type && this.listeners.has(type)) {
            this.listeners.get(type)!.forEach((callback) => callback(data));
          }
          // Also invoke wildcards if any
          if (this.listeners.has("*")) {
            this.listeners.get("*")!.forEach((callback) => callback(data));
          }
        } catch (e) {
          console.warn("Failed to parse WS payload:", e);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        if (!this.isExplicitlyClosed) {
          this.reconnectTimer = setTimeout(() => {
            console.log("⚡ [VOIDWARE WS] Attempting reconnection...");
            this.connect();
          }, 2000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("⚡ [VOIDWARE WS] Socket error:", err);
      };
    } catch (e) {
      console.warn("Could not establish WS connection:", e);
    }
  }

  public subscribe(eventType: string, listener: SocketListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Ensure connection is active
    this.connect();

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public close() {
    this.isExplicitlyClosed = true;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketService = new SocketService();
