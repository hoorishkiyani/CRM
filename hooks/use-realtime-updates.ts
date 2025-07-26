"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useRealTimeUpdates(table: string, onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload) => {
          console.log(`Real-time update on ${table}:`, payload)
          onUpdate()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onUpdate])
}
