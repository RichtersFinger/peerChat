import { create } from "zustand";
import { produce } from "immer";
import { Socket } from "socket.io-client";

interface ConnectionState {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export type Conversation = {
  id: string;
  lastModified: string;
  peer?: string;
  name?: string;
  length?: number;
  unreadMessages?: boolean;
};

interface Conversations {
  data: Record<string, Conversation>;
  ids: string[];
  setConversation: (c: Conversation) => void;
  fetch: (socket: Socket, id: string) => void;
  fetchAll: (socket: Socket) => void;
  listen: (socket: Socket) => void;
  stopListening: (socket: Socket) => void;
}

interface StoreState {
  socket: ConnectionState;
  conversations: Conversations;
}

const useStore = create<StoreState>((set, get) => ({
  socket: {
    connected: false,
    connect: () =>
      set(
        produce((state: StoreState) => {
          state.socket.connected = true;
        })
      ),
    disconnect: () =>
      set(
        produce((state: StoreState) => {
          state.socket.connected = false;
        })
      ),
  },
  conversations: {
    data: {},
    ids: [],
    setConversation: (c: Conversation) => {
      set(
        produce((state: StoreState) => {
          state.conversations.data = { ...state.conversations.data, [c.id]: c };
          if (!state.conversations.ids.includes(c.id))
            state.conversations.ids = [c.id, ...state.conversations.ids];
        })
      );
    },
    fetch: (socket, id) => {
      socket.emit("get-conversation", id, (c: Conversation) => {
        get().conversations.setConversation(c);
      });
    },
    fetchAll: (socket) => {
      socket.emit("list-conversations", (ids: string[]) => {
        ids.forEach((id) => get().conversations.fetch(socket, id));
        set(
          produce((state: StoreState) => {
            state.conversations.ids = ids;
          })
        );
      });
    },
    listen: (socket) => {
      socket.on("new-conversation", (id: string) =>
        get().conversations.fetch(socket, id)
      );
      socket.on("update-conversation", (c: Conversation) => {
        get().conversations.setConversation(c);
      });
    },
    stopListening: (socket) => {
      socket.off("new-conversation");
      socket.off("update-conversation");
    },
  },
}));

export default useStore;
