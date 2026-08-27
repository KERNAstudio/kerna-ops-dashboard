// Generated via the Supabase MCP `generate_typescript_types` tool from the live schema.
// Regenerate after every migration instead of hand-editing.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      access_methods: {
        Row: {
          access_mode: string | null
          created_at: string
          created_by: string | null
          delegated_email: string | null
          deleted_at: string | null
          encrypted_password: string | null
          external_account_identifier: string | null
          id: string
          login_identifier: string | null
          oauth_access_token: string | null
          oauth_refresh_token: string | null
          platform_name: string
          project_id: string
          retention_expires_at: string | null
          risk_level: string | null
          role_assigned: string | null
          token_expires_at: string | null
        }
        Insert: {
          access_mode?: string | null
          created_at?: string
          created_by?: string | null
          delegated_email?: string | null
          deleted_at?: string | null
          encrypted_password?: string | null
          external_account_identifier?: string | null
          id?: string
          login_identifier?: string | null
          oauth_access_token?: string | null
          oauth_refresh_token?: string | null
          platform_name: string
          project_id: string
          retention_expires_at?: string | null
          risk_level?: string | null
          role_assigned?: string | null
          token_expires_at?: string | null
        }
        Update: {
          access_mode?: string | null
          created_at?: string
          created_by?: string | null
          delegated_email?: string | null
          deleted_at?: string | null
          encrypted_password?: string | null
          external_account_identifier?: string | null
          id?: string
          login_identifier?: string | null
          oauth_access_token?: string | null
          oauth_refresh_token?: string | null
          platform_name?: string
          project_id?: string
          retention_expires_at?: string | null
          risk_level?: string | null
          role_assigned?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_methods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_methods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      access_sessions: {
        Row: {
          access_method_id: string
          device_info: Json | null
          ended_at: string | null
          id: string
          ip_address: unknown
          reason: string | null
          session_type: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          access_method_id: string
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          reason?: string | null
          session_type?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          access_method_id?: string
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          reason?: string | null
          session_type?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_sessions_access_method_id_fkey"
            columns: ["access_method_id"]
            isOneToOne: false
            referencedRelation: "access_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_action_logs: {
        Row: {
          access_method_id: string
          action_type: string
          created_at: string
          id: string
          ip_address: unknown
          payload_summary: Json | null
          response_status: string | null
          user_id: string | null
        }
        Insert: {
          access_method_id: string
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          payload_summary?: Json | null
          response_status?: string | null
          user_id?: string | null
        }
        Update: {
          access_method_id?: string
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          payload_summary?: Json | null
          response_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_action_logs_access_method_id_fkey"
            columns: ["access_method_id"]
            isOneToOne: false
            referencedRelation: "access_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_action_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approved_at: string | null
          created_at: string
          id: string
          lock_expires_at: string | null
          module_version_id: string
          status: string
          withdrawn_at: string | null
          withdrawn_by: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          id?: string
          lock_expires_at?: string | null
          module_version_id: string
          status?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          id?: string
          lock_expires_at?: string | null
          module_version_id?: string
          status?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_module_version_id_fkey"
            columns: ["module_version_id"]
            isOneToOne: false
            referencedRelation: "module_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_state: Json | null
          previous_state: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          sender_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          project_id: string
          sender_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          email: string
          id: string
          password_hash: string
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          email: string
          id?: string
          password_hash: string
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          client_view_mode: string
          company_name: string
          created_at: string
          id: string
          onboarding_confirmed_at: string | null
          poc_user_id: string | null
          primary_contact_name: string
          primary_email: string
          primary_phone: string | null
        }
        Insert: {
          address?: string | null
          client_view_mode?: string
          company_name: string
          created_at?: string
          id?: string
          onboarding_confirmed_at?: string | null
          poc_user_id?: string | null
          primary_contact_name: string
          primary_email: string
          primary_phone?: string | null
        }
        Update: {
          address?: string | null
          client_view_mode?: string
          company_name?: string
          created_at?: string
          id?: string
          onboarding_confirmed_at?: string | null
          poc_user_id?: string | null
          primary_contact_name?: string
          primary_email?: string
          primary_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_poc_user_id_fkey"
            columns: ["poc_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_versions: {
        Row: {
          contract_id: string
          document_url: string | null
          id: string
          is_active: boolean
          issued_at: string | null
          signature_data: string | null
          signature_type: string | null
          signed_at: string | null
          signed_by: string | null
          version_number: number
        }
        Insert: {
          contract_id: string
          document_url?: string | null
          id?: string
          is_active?: boolean
          issued_at?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string | null
          signed_by?: string | null
          version_number: number
        }
        Update: {
          contract_id?: string
          document_url?: string | null
          id?: string
          is_active?: boolean
          issued_at?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string | null
          signed_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_versions_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          id: string
          project_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          credit_note_number: string
          financial_year: string
          id: string
          invoice_id: string
          issued_at: string
          reason: string | null
          sequence_number: number
        }
        Insert: {
          amount: number
          credit_note_number: string
          financial_year: string
          id?: string
          invoice_id: string
          issued_at?: string
          reason?: string | null
          sequence_number: number
        }
        Update: {
          amount?: number
          credit_note_number?: string
          financial_year?: string
          id?: string
          invoice_id?: string
          issued_at?: string
          reason?: string | null
          sequence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          escalation_type: string
          id: string
          owner_id: string | null
          project_id: string
          reason: string | null
          resolution_notes: string | null
          severity: string
          status: string
          triggered_by: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          escalation_type: string
          id?: string
          owner_id?: string | null
          project_id: string
          reason?: string | null
          resolution_notes?: string | null
          severity: string
          status?: string
          triggered_by: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          escalation_type?: string
          id?: string
          owner_id?: string | null
          project_id?: string
          reason?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          ai_output: Json | null
          ai_processed: boolean
          created_at: string
          id: string
          project_id: string
          raw_text: string
          sentiment: string | null
          structured_tags: Json | null
          submitted_by: string | null
        }
        Insert: {
          ai_output?: Json | null
          ai_processed?: boolean
          created_at?: string
          id?: string
          project_id: string
          raw_text: string
          sentiment?: string | null
          structured_tags?: Json | null
          submitted_by?: string | null
        }
        Update: {
          ai_output?: Json | null
          ai_processed?: boolean
          created_at?: string
          id?: string
          project_id?: string
          raw_text?: string
          sentiment?: string | null
          structured_tags?: Json | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          project_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          financial_year: string
          gst_amount: number
          id: string
          invoice_number: string
          issued_at: string
          project_id: string
          sequence_number: number
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          financial_year: string
          gst_amount?: number
          id?: string
          invoice_number: string
          issued_at?: string
          project_id: string
          sequence_number: number
          status?: string
          subtotal: number
          total: number
        }
        Update: {
          financial_year?: string
          gst_amount?: number
          id?: string
          invoice_number?: string
          issued_at?: string
          project_id?: string
          sequence_number?: number
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company_name: string
          contact_name: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      module_assignments: {
        Row: {
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "project_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      module_versions: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          module_id: string
          notes: string | null
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          module_id: string
          notes?: string | null
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          module_id?: string
          notes?: string | null
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "module_versions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "project_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          message: string
          read: boolean
          severity: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          message: string
          read?: boolean
          severity?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          message?: string
          read?: boolean
          severity?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          payment_type: string
          project_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_type: string
          project_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_type?: string
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      project_modules: {
        Row: {
          created_at: string
          id: string
          internal_deadline: string | null
          module_type: string
          project_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          internal_deadline?: string | null
          module_type: string
          project_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          internal_deadline?: string | null
          module_type?: string
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_modules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          change_request_window_expires_at: string | null
          client_deadline: string | null
          client_id: string
          created_at: string
          health_score_internal: number | null
          health_status_client: string | null
          id: string
          internal_deadline: string | null
          maintenance_days: number | null
          maintenance_expires_at: string | null
          status: string
          type: string
        }
        Insert: {
          change_request_window_expires_at?: string | null
          client_deadline?: string | null
          client_id: string
          created_at?: string
          health_score_internal?: number | null
          health_status_client?: string | null
          id?: string
          internal_deadline?: string | null
          maintenance_days?: number | null
          maintenance_expires_at?: string | null
          status?: string
          type: string
        }
        Update: {
          change_request_window_expires_at?: string | null
          client_deadline?: string | null
          client_id?: string
          created_at?: string
          health_score_internal?: number | null
          health_status_client?: string | null
          id?: string
          internal_deadline?: string | null
          maintenance_days?: number | null
          maintenance_expires_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_line_items: {
        Row: {
          description: string | null
          id: string
          quantity: number
          quotation_version_id: string
          title: string
          total: number
          unit_price: number
        }
        Insert: {
          description?: string | null
          id?: string
          quantity?: number
          quotation_version_id: string
          title: string
          total: number
          unit_price: number
        }
        Update: {
          description?: string | null
          id?: string
          quantity?: number
          quotation_version_id?: string
          title?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_line_items_quotation_version_id_fkey"
            columns: ["quotation_version_id"]
            isOneToOne: false
            referencedRelation: "quotation_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_versions: {
        Row: {
          advance_percent: number
          created_at: string
          discount: number
          id: string
          is_final: boolean
          quotation_id: string
          subtotal: number
          total: number
          version_number: number
        }
        Insert: {
          advance_percent?: number
          created_at?: string
          discount?: number
          id?: string
          is_final?: boolean
          quotation_id: string
          subtotal?: number
          total?: number
          version_number: number
        }
        Update: {
          advance_percent?: number
          created_at?: string
          discount?: number
          id?: string
          is_final?: boolean
          quotation_id?: string
          subtotal?: number
          total?: number
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_versions_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          poc_id: string | null
          status: string
          template_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          poc_id?: string | null
          status?: string
          template_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          poc_id?: string | null
          status?: string
          template_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_poc_id_fkey"
            columns: ["poc_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          downloadable: boolean
          file_url: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          downloadable?: boolean
          file_url: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          downloadable?: boolean
          file_url?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          grace_period_days: number | null
          id: string
          next_due_date: string | null
          project_id: string
        }
        Insert: {
          billing_cycle: string
          created_at?: string
          grace_period_days?: number | null
          id?: string
          next_due_date?: string | null
          project_id: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          grace_period_days?: number | null
          id?: string
          next_due_date?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      termination_requests: {
        Row: {
          created_at: string
          id: string
          project_id: string
          requested_by: string | null
          resolved_at: string | null
          settlement_amount: number | null
          settlement_paid_at: string | null
          settlement_status: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          requested_by?: string | null
          resolved_at?: string | null
          settlement_amount?: number | null
          settlement_paid_at?: string | null
          settlement_status?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          requested_by?: string | null
          resolved_at?: string | null
          settlement_amount?: number | null
          settlement_paid_at?: string | null
          settlement_status?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "termination_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
