type Listener = () => void;
const listeners = new Set<Listener>();

export const syncEmitter = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit() {
    listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error("Listener error", e);
      }
    });
  }
};
