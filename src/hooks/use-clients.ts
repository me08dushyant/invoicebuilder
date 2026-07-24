import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import * as repo from "@/data/repository"
import type { Client } from "@/data/types"

export function useClients() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  return useQuery({
    queryKey: ["clients", userId],
    queryFn: () => repo.listClients(userId),
  })
}

export function useSaveClient() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (client: Omit<Client, "id" | "createdAt"> & { id?: string }) =>
      repo.saveClient(userId, client),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", userId] }),
  })
}

export function useDeleteClient() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteClient(userId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", userId] }),
  })
}
