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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      beneficiaries: {
        Row: {
          created_at: string
          full_name: string
          id: string
          membership_id: string | null
          mobile_number: string | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          membership_id?: string | null
          mobile_number?: string | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          membership_id?: string | null
          mobile_number?: string | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_products: {
        Row: {
          coverage_amount: number
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          slug: string
          sort_order: number
          status: string
          term_months: number
        }
        Insert: {
          coverage_amount?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          slug: string
          sort_order?: number
          status?: string
          term_months?: number
        }
        Update: {
          coverage_amount?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          status?: string
          term_months?: number
        }
        Relationships: []
      }
      insurance_applications: {
        Row: {
          address_line: string | null
          amount: number | null
          barangay: string | null
          beneficiary_date_of_birth: string | null
          beneficiary_full_name: string | null
          beneficiary_mobile: string | null
          beneficiary_relationship: string | null
          city: string | null
          civil_status: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gov_id_number: string | null
          gov_id_path: string | null
          gov_id_type: string | null
          id: string
          last_name: string
          membership_id: string | null
          middle_name: string | null
          mobile: string | null
          nationality: string | null
          occupation: string | null
          postal_code: string | null
          product_id: string | null
          province: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_path: string | null
          sex: string | null
          status: string
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          address_line?: string | null
          amount?: number | null
          barangay?: string | null
          beneficiary_date_of_birth?: string | null
          beneficiary_full_name?: string | null
          beneficiary_mobile?: string | null
          beneficiary_relationship?: string | null
          city?: string | null
          civil_status?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gov_id_number?: string | null
          gov_id_path?: string | null
          gov_id_type?: string | null
          id?: string
          last_name: string
          membership_id?: string | null
          middle_name?: string | null
          mobile?: string | null
          nationality?: string | null
          occupation?: string | null
          postal_code?: string | null
          product_id?: string | null
          province?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string | null
          sex?: string | null
          status?: string
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          address_line?: string | null
          amount?: number | null
          barangay?: string | null
          beneficiary_date_of_birth?: string | null
          beneficiary_full_name?: string | null
          beneficiary_mobile?: string | null
          beneficiary_relationship?: string | null
          city?: string | null
          civil_status?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gov_id_number?: string | null
          gov_id_path?: string | null
          gov_id_type?: string | null
          id?: string
          last_name?: string
          membership_id?: string | null
          middle_name?: string | null
          mobile?: string | null
          nationality?: string | null
          occupation?: string | null
          postal_code?: string | null
          product_id?: string | null
          province?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string | null
          sex?: string | null
          status?: string
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_applications_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_applications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          membership_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          membership_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          membership_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          product_id: string
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          product_id: string
          start_date?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          product_id?: string
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          middle_name: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string
          id: string
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          amount: number
          created_at: string
          earner_id: string
          id: string
          level: number
          membership_id: string | null
          source_user_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          earner_id: string
          id?: string
          level: number
          membership_id?: string | null
          source_user_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          earner_id?: string
          id?: string
          level?: number
          membership_id?: string | null
          source_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_levels: {
        Row: {
          amount: number
          level: number
        }
        Insert: {
          amount: number
          level: number
        }
        Update: {
          amount?: number
          level?: number
        }
        Relationships: []
      }
      virtual_ids: {
        Row: {
          expiry_date: string | null
          id: string
          issued_at: string
          member_id: string
          membership_id: string | null
          qr_token: string
          status: string
          user_id: string
        }
        Insert: {
          expiry_date?: string | null
          id?: string
          issued_at?: string
          member_id: string
          membership_id?: string | null
          qr_token?: string
          status?: string
          user_id: string
        }
        Update: {
          expiry_date?: string | null
          id?: string
          issued_at?: string
          member_id?: string
          membership_id?: string | null
          qr_token?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_ids_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          total_earnings: number
          total_withdrawals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          total_earnings?: number
          total_withdrawals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          total_earnings?: number
          total_withdrawals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          paid_at: string | null
          paymongo_intent_id: string | null
          qr_image_url: string | null
          status: string
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          paymongo_intent_id?: string | null
          qr_image_url?: string | null
          status?: string
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          paymongo_intent_id?: string | null
          qr_image_url?: string | null
          status?: string
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: []
      }
      withdrawal_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          bank_name: string | null
          created_at: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          bank_name?: string | null
          created_at?: string
          id?: string
          label?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_snapshot: Json | null
          amount: number
          created_at: string
          id: string
          paymongo_status: string | null
          paymongo_transfer_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          account_snapshot?: Json | null
          amount: number
          created_at?: string
          id?: string
          paymongo_status?: string | null
          paymongo_transfer_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          account_snapshot?: Json | null
          amount?: number
          created_at?: string
          id?: string
          paymongo_status?: string | null
          paymongo_transfer_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_accident_plan: {
        Args: {
          p_full_name: string
          p_gov_id_path: string
          p_mobile: string
          p_relationship: string
          p_selfie_path: string
        }
        Returns: Json
      }
      admin_approve_application: {
        Args: { p_application_id: string }
        Returns: Json
      }
      admin_adjust_wallet: {
        Args: { p_user_id: string; p_amount: number; p_reason?: string }
        Returns: number
      }
      admin_approve_withdrawal: { Args: { p_request_id: string }; Returns: undefined }
      admin_set_super_admin: {
        Args: { p_user_id: string; p_make: boolean }
        Returns: undefined
      }
      admin_mark_withdrawal_paid: {
        Args: { p_request_id: string; p_ref?: string }
        Returns: undefined
      }
      admin_reject_application: {
        Args: { p_application_id: string; p_notes?: string }
        Returns: undefined
      }
      admin_reject_withdrawal: {
        Args: { p_request_id: string; p_notes?: string }
        Returns: undefined
      }
      is_super_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      request_withdrawal: {
        Args: { p_amount: number; p_account_id: string }
        Returns: string
      }
      system_fulfill_deposit: {
        Args: { p_intent_id: string }
        Returns: boolean
      }
      system_resolve_withdrawal_transfer: {
        Args: { p_transfer_id: string; p_status: string; p_reason?: string }
        Returns: undefined
      }
      distribute_referral_commissions: {
        Args: { p_membership_id: string; p_source_user: string }
        Returns: undefined
      }
      generate_referral_code: { Args: Record<PropertyKey, never>; Returns: string }
      normalize_ph_phone: { Args: { p_input: string }; Returns: string }
      resolve_auth_email: { Args: { identifier: string }; Returns: string }
      submit_insurance_application: {
        Args: {
          p_product_id: string
          p_gov_id_path: string
          p_selfie_path: string
          p_payload: Json
        }
        Returns: string
      }
      verify_virtual_id: {
        Args: { p_token: string }
        Returns: {
          member_id: string
          full_name: string | null
          status: string
          product_name: string | null
          issued_at: string
          expiry_date: string | null
          is_valid: boolean
        }[]
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
