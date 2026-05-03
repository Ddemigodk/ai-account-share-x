import { useCallback } from "react";
import { trpc } from "@/providers/trpc";

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: "admin" | "member";
  level: number;
}

export function useAuth() {
  const utils = trpc.useUtils();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      utils.auth.me.invalidate();
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    utils.auth.me.invalidate();
    window.location.reload();
  }, [utils]);

  return {
    user: user as AuthUser | null | undefined,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login: loginMutation.mutateAsync,
    logout,
  };
}
