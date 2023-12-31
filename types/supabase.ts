export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      champions: {
        Row: {
          id: number
          image: string | null
          name: string | null
        }
        Insert: {
          id: number
          image?: string | null
          name?: string | null
        }
        Update: {
          id?: number
          image?: string | null
          name?: string | null
        }
        Relationships: []
      }
      champions_by_user: {
        Row: {
          champions: string
          champions_ids: number[]
          champions_jsonb: Json
          id: string
        }
        Insert: {
          champions?: string
          champions_ids?: number[]
          champions_jsonb?: Json
          id: string
        }
        Update: {
          champions?: string
          champions_ids?: number[]
          champions_jsonb?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "champions_by_user_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      example_todo: {
        Row: {
          created_at: string | null
          id: number
          text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "example_todo_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      todos: {
        Row: {
          created_at: string
          id: string
          is_complete: boolean | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_complete?: boolean | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_complete?: boolean | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      json_matches_schema: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: boolean
      }
      jsonb_matches_schema: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
