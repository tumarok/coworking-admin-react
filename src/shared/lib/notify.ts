export type NoticeSeverity = 'success' | 'info' | 'warn' | 'error';

export interface Notice {
  severity: NoticeSeverity;
  summary: string;
  detail?: string;
}

type Listener = (notice: Notice) => void;

const listeners = new Set<Listener>();

/**
 * A tiny event bus for user-facing notices. Code outside React (middleware, API layer) publishes;
 * the toast host in the app layer subscribes. This keeps the lower layers free of UI imports.
 */
export const notify = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit(notice: Notice) {
    listeners.forEach((listener) => listener(notice));
  },
  success(summary: string, detail?: string) {
    this.emit({ severity: 'success', summary, detail });
  },
  error(summary: string, detail?: string) {
    this.emit({ severity: 'error', summary, detail });
  },
};
