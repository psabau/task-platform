// web-shell/src/store/notifications.js
import { create } from "zustand";

let eventSource = null;

const useNotifications = create((set, get) => ({
  events: [],
  status: "idle", // idle | connecting | connected | error
  initCalled: false,

  init: () => {
    const { initCalled } = get();
    if (initCalled) return; // already running

    set({ initCalled: true, status: "connecting" });

    eventSource = new EventSource("/notifications/stream");
    console.log("[Notifications] Opening SSE /notifications/stream");

    eventSource.onopen = () => {
      console.log("[Notifications] SSE connected");
      set({ status: "connected" });
    };

    eventSource.onmessage = (e) => {
      console.log("[Notifications] SSE message:", e.data);
      try {
        const data = JSON.parse(e.data);
        const event = {
          id: Date.now() + Math.random(),
          receivedAt: new Date().toISOString(),
          ...data,
        };

        set((state) => ({
          events: [event, ...state.events].slice(0, 50),
        }));
      } catch (err) {
        console.error("[Notifications] Bad SSE payload", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[Notifications] SSE error", err);
      set({ status: "error" });
      // browser will auto-retry; we keep status as "error" until next open
    };
  },

  clear: () => set({ events: [] }),
}));

export default useNotifications;
