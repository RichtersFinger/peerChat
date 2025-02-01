import useUserName from "./useUserName";
import useUserAvatar from "./useUserAvatar";
import useUserAddress from "./useUserAddress";

export type User = {
  name: string | null;
  avatar: string | null;
  address: string | null;
};

export default function useUser(url?: string): User {
  const userName = useUserName(url);
  const userAvatar = useUserAvatar(url);
  const userAddress = useUserAddress(url);

  return { name: userName, avatar: userAvatar, address: userAddress };
}
