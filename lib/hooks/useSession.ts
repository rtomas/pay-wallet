"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR("/api/auth/session", fetcher);

  return {
    session: data?.authenticated ? { userId: data.userId } : null,
    isLoading,
    error,
    mutate,
  };
}
