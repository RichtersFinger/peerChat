import { useState, useEffect } from "react";

export default function useUserAvatar(url?: string) {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (url)
      fetch(url + "/api/v0/user/avatar")
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
              setAvatar(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error("Failed to fetch resource: ", error);
        });
  }, [url, setAvatar]);

  return avatar;
}
