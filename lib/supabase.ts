import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string | null
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          lead_number: number
          contact_id: string
          product: string
          notes: string | null
          notes_internal: any[]
          label_color: string | null
          label_text: string | null
          current_stage: string
          is_locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_number?: number
          contact_id: string
          product: string
          notes?: string | null
          notes_internal?: any[]
          label_color?: string | null
          label_text?: string | null
          current_stage?: string
          is_locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          product?: string
          notes?: string | null
          notes_internal?: any[]
          label_color?: string | null
          label_text?: string | null
          current_stage?: string
          is_locked?: boolean
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          lead_id: string
          text: string
          type: string
          is_completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          text: string
          type: string
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          text?: string
          type?: string
          is_completed?: boolean
          completed_at?: string | null
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          lead_id: string
          message_id: string | null
          content: string
          channel: string
          sender: string
          timestamp: string
          response: string | null
          ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          message_id?: string | null
          content: string
          channel: string
          sender: string
          timestamp?: string
          response?: string | null
          ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          message_id?: string | null
          content?: string
          channel?: string
          sender?: string
          timestamp?: string
          response?: string | null
          ai_generated?: boolean
        }
      }
      pipeline_stages: {
        Row: {
          id: string
          name: string
          order_index: number
          color: string
          description: string | null
        }
        Insert: {
          id: string
          name: string
          order_index: number
          color: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          order_index?: number
          color?: string
          description?: string | null
        }
      }
    }
  }
}
