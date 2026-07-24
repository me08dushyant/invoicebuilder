import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import * as repo from "@/data/repository"
import type { Invoice } from "@/data/types"

export function useInvoices() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  return useQuery({
    queryKey: ["invoices", userId],
    queryFn: () => repo.listInvoices(userId),
  })
}

export function useSaveInvoice() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt"> & { id?: string }
    ) => repo.saveInvoice(userId, invoice),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices", userId] }),
  })
}

export function useDeleteInvoice() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteInvoice(userId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices", userId] }),
  })
}
