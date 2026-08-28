/// <reference types="vite/client" />

interface Window {
  slavic: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    on: (channel: string, cb: (...args: unknown[]) => void) => () => void;
    win: { minimize: () => void; maximize: () => void; close: () => void };
  };
}
