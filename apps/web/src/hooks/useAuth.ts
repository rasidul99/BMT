import { useMutation } from "@tanstack/react-query"
import { useAuthStore, type User } from "../stores/auth.store"
import { AuthService } from "../services/auth.service"

export function useAuth() {
  const { user, token, setSession, clearSession } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: AuthService.login,
    onSuccess: (res: any) => {
      const token = res?.data?.accessToken || res?.accessToken || res?.token
      const refreshToken = res?.data?.refreshToken || res?.refreshToken
      const user = res?.data?.user || res?.user || { id: "user-1", email: "user@bmt.com", name: "User" }
      setSession(token, refreshToken, user)
    },
  })

  const registerMutation = useMutation({
    mutationFn: AuthService.register,
  })

  return {
    user,
    token,
    isAuthenticated: !!token,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: clearSession,
    setSession,
  }
}
