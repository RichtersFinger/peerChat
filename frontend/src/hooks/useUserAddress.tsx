import { useState, useEffect } from "react";

export default function useUserAddress(url?: string) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setAddress(null);
    if (url)
      fetch(url + "/user/address", {
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("HTTP-Error", { cause: response });
          } else {
            return response.text();
          }
        })
        .then((text) => {
            setAddress(text.startsWith("<!DOCTYPE html>") ? null : text);
        })
        .catch((error) => {
          console.error("Failed to fetch resource: ", error);
        });
  }, [url, setAddress]);

  return address;
}
