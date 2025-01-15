import useUserName from "./useUserName";
import useUserAvatar from "./useUserAvatar";

export type User = {
  name: string | null;
  avatar: string | null;
};

export default function useUser(url?: string): User {
  const userName = useUserName(url);
  const userAvatar = useUserAvatar(url);

  return { name: userName, avatar: userAvatar };
}
