import { useState, useEffect } from "react";

export default function useUserName(url?: string) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(null);
    if (url)
      fetch(url + "/api/v0/user/name")
        .then((response) => {
          if (!response.ok) {
            throw new Error("HTTP-Error", { cause: response });
          } else {
            return response.text();
          }
        })
        .then((text) => {
          setName(text.startsWith("<!DOCTYPE html>") ? null : text);
        })
        .catch((error) => {
          console.error("Failed to fetch resource: ", error);
        });
  }, [url, setName]);

  return name;
}
