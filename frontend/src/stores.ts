import { create } from "zustand";
import { produce } from "immer";

interface ConnectionState {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

interface StoreState {
  socket: ConnectionState;
}

const useStore = create<StoreState>((set) => ({
  socket: {
    connected: false,
    connect: () =>
      set(produce((state: StoreState) => {state.socket.connected = true})),
    disconnect: () =>
        set(produce((state: StoreState) => {state.socket.connected = false})),
  },
}));

export default useStore;
