import { useRef } from "react";

import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  withCredentials: true,
});

export default function App() {
  const pingRef = useRef<HTMLParagraphElement>(null);
  const eventRef = useRef<HTMLParagraphElement>(null);
  const createKeyInputRef = useRef<HTMLInputElement>(null);
  const createKeyRef = useRef<HTMLParagraphElement>(null);

  socket.on("event-response", (value) => {
    if (eventRef.current) eventRef.current.innerText = JSON.stringify(value);
  });

  return (
    <div>
      <button
        onClick={() => {
          fetch("http://localhost:5000/ping")
            .then((response) => response.text())
            .then((text) => {
              if (pingRef.current) pingRef.current.innerText = text;
            });
        }}
      >
        ping
      </button>
      <p ref={pingRef}></p>
      <input ref={createKeyInputRef} type="text" />
      <button
        onClick={() => {
          fetch("http://localhost:5000/auth/key", {
            method: "POST",
            body: JSON.stringify(
              createKeyInputRef.current
                ? { peerChatAuth: createKeyInputRef.current.value }
                : {}
            ),
            headers: { "content-type": "application/json" },
          })
            .then((response) => response.text())
            .then((text) => {
              if (createKeyRef.current) createKeyRef.current.innerText = text;
            });
        }}
      >
        create key
      </button>
      <p ref={createKeyRef}></p>
      <button
        onClick={() => {
          socket.connect();
        }}
      >
        connect
      </button>
      <button
        onClick={() => {
          socket.emit("event", function (data: string) {
            console.log(data);
          });
        }}
      >
        event
      </button>
      <p ref={eventRef}></p>
    </div>
  );
}
