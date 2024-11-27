import { useRef } from "react";

function App() {
  const pingRef = useRef<HTMLParagraphElement>(null);

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
    </div>
  );
}

export default App;
