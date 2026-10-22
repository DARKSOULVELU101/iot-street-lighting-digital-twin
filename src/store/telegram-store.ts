import { create } from "zustand";

export type MessageKind = "info" | "success" | "warning" | "error";

export interface TelegramMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  kind: MessageKind;
  at: number;
}

interface TelegramStore {
  messages: TelegramMessage[];
  push: (message: Omit<TelegramMessage, "id" | "at"> & { at?: number }) => void;
  clear: () => void;
}

let messageSeq = 0;

export const useTelegramStore = create<TelegramStore>()((set) => ({
  messages: [],
  push: (message) =>
    set((state) => ({
      messages: [
        ...state.messages.slice(-60),
        {
          id: `msg-${(messageSeq += 1)}`,
          role: message.role,
          text: message.text,
          kind: message.kind,
          at: message.at ?? Date.now(),
        },
      ],
    })),
  clear: () => set({ messages: [] }),
}));
