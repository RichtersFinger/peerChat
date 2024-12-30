import { useRef } from "react";
import { io } from "socket.io-client";
import { Button } from "flowbite-react";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  withCredentials: true,
});

const authKey = "peerChatAuth";

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
      <Button
        size="xs"
        onClick={() => {
          fetch("http://localhost:5000/ping")
            .then((response) => response.text())
            .then((text) => {
              if (pingRef.current) pingRef.current.innerText = text;
            });
        }}
      >
        ping
      </Button>
      <p ref={pingRef}></p>
      <input ref={createKeyInputRef} type="text" />
      <Button
        size="xs"
        onClick={() => {
          fetch("http://localhost:5000/auth/key", {
            method: "POST",
            body: JSON.stringify(
              createKeyInputRef.current
                ? { [authKey]: createKeyInputRef.current.value }
                : {}
            ),
            headers: { "content-type": "application/json" },
          })
            .then((response) => {
              return { status: response.status, text: response.text() };
            })
            .then(async (data) => {
              const text = await data.text;
              if (createKeyRef.current) createKeyRef.current.innerText = text;
              if (data.status === 200)
                document.cookie =
                  authKey + "=" + text + "; path=/; max-age:2147483647";
            });
        }}
      >
        create key
      </Button>
      <p ref={createKeyRef}></p>
      <Button
        size="xs"
        onClick={() => {
          socket.connect();
        }}
      >
        connect
      </Button>
      <Button
        size="xs"
        onClick={() => {
          socket.emit("event", function (data: string) {
            console.log(data);
          });
        }}
      >
        event
      </Button>
      <p ref={eventRef}></p>
    </div>
  );
}
