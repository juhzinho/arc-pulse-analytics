"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";

export function LiveSummary() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(`${API_URL}/v1/stream/metrics`);
    source.addEventListener("summary", (event) => {
      queryClient.setQueryData(["summary"], JSON.parse(event.data));
    });
    return () => source.close();
  }, [queryClient]);

  return null;
}
