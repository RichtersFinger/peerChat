import { useRef } from "react";

import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

export default function App() {
  const pingRef = useRef<HTMLParagraphElement>(null);
  const eventRef = useRef<HTMLParagraphElement>(null);
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
      <button
        onClick={() => {
          socket.connect();
        }}
      >
        connect
      </button>
      <button
        onClick={() => {
          socket.emit("event");
        }}
      >
        event
      </button>
      <p ref={eventRef}></p>
    </div>
  );
}
