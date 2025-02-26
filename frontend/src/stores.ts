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
  removeConversation: (id: string) => void;
  fetch: (socket: Socket, id: string) => void;
  fetchAll: (socket: Socket) => void;
  listen: (socket: Socket) => void;
  stopListening: (socket: Socket) => void;
}

interface ActiveConversation {
  id?: string;
  setId: (id: string) => void;
  unset: () => void;
}

interface PeerStatus {
  name?: string;
  avatar?: string;
}

interface Peers {
  data: Record<string, PeerStatus>;
  setName: (address: string, name: string) => void;
  setAvatar: (address: string, avatar: string) => void;
  fetch: (address: string) => void;
  listen: (socket: Socket) => void;
  stopListening: (socket: Socket) => void;
}

interface StoreState {
  socket: ConnectionState;
  conversations: Conversations;
  activeConversation: ActiveConversation;
  peers: Peers;
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
    removeConversation: (id: string) => {
      set(
        produce((state: StoreState) => {
          if (state.conversations.ids.includes(id)) {
            delete state.conversations.data[id];
            state.conversations.ids = state.conversations.ids.filter(
              (id_: string) => id_ !== id
            );
          }
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
      socket.on("removed-conversation", (id: string) => {
        get().conversations.removeConversation(id);
      });
    },
    stopListening: (socket) => {
      socket.off("new-conversation");
      socket.off("update-conversation");
      socket.off("removed-conversation");
    },
  },
  activeConversation: {
    setId: (id) => {
      set(
        produce((state: StoreState) => {
          state.activeConversation.id = id;
        })
      );
    },
    unset: () => {
      set(
        produce((state: StoreState) => {
          state.activeConversation.id = undefined;
        })
      );
    },
  },
  peers: {
    data: {},
    setName: (address, name) => {
      set(
        produce((state: StoreState) => {
          if (!state.peers.data[address])
            state.peers.data = { ...state.peers.data, [address]: {} };
          state.peers.data[address].name = name;
        })
      );
    },
    setAvatar: (address, avatar) => {
      set(
        produce((state: StoreState) => {
          if (!state.peers.data[address])
            state.peers.data = { ...state.peers.data, [address]: {} };
          state.peers.data[address].avatar = avatar;
        })
      );
    },
    fetch: (address) => {
      // fetch username
      fetch(address + "/api/v0/user/name")
        .then((response) => {
          if (!response.ok) {
            throw new Error("HTTP-Error", { cause: response });
          } else {
            return response.text();
          }
        })
        .then((text) => {
          if (!text.startsWith("<!DOCTYPE html>"))
            get().peers.setName(address, text);
        })
        .catch((error) => {
          console.error(`Failed to fetch username at '${address}': `, error);
        });
      // fetch avatar
      fetch(address + "/api/v0/user/avatar")
        .then((response) => {
          if (!response.ok) {
            throw new Error("HTTP-Error", { cause: response });
          } else {
            return response.blob();
          }
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (
              reader.result &&
              typeof reader.result === "string" &&
              reader.result.startsWith("data:image")
            ) {
              get().peers.setAvatar(address, reader.result);
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error(`Failed to fetch avatar at '${address}': `, error);
        });
    },
    listen: (socket) => {
      socket.on("changed-peer", (address: string) =>
        get().peers.fetch(address)
      );
    },
    stopListening: (socket) => {
      socket.off("changed-peer");
    },
  },
}));

export default useStore;
