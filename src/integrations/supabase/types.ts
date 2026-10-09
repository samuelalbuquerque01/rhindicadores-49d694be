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
      afastamentos: {
        Row: {
          anexo_url: string | null
          colaborador_id: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          dias_afastados: number | null
          id: string
          observacoes: string | null
          tipo: string
        }
        Insert: {
          anexo_url?: string | null
          colaborador_id?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          dias_afastados?: number | null
          id?: string
          observacoes?: string | null
          tipo: string
        }
        Update: {
          anexo_url?: string | null
          colaborador_id?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dias_afastados?: number | null
          id?: string
          observacoes?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "afastamentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_filiais: {
        Row: {
          colaborador_id: string
          filial_id: string
          is_primary: boolean
          synced_at: string
          systea_clinic_id: number
        }
        Insert: {
          colaborador_id: string
          filial_id: string
          is_primary?: boolean
          synced_at?: string
          systea_clinic_id: number
        }
        Update: {
          colaborador_id?: string
          filial_id?: string
          is_primary?: boolean
          synced_at?: string
          systea_clinic_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_filiais_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_filiais_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_filiais_systea_clinic_id_fkey"
            columns: ["systea_clinic_id"]
            isOneToOne: false
            referencedRelation: "systea_clinic_filiais"
            referencedColumns: ["systea_clinic_id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          cargo: string
          cpf: string | null
          created_at: string
          custo_mensal: number | null
          data_admissao: string
          data_desligamento: string | null
          data_nascimento: string | null
          departamento: string
          email: string | null
          filial_id: string | null
          genero: string | null
          id: string
          is_lider: boolean | null
          nome: string
          salario_base: number | null
          status: string | null
          systea_admin_id: number | null
          systea_area_name: string | null
          systea_area_operation_id: number | null
          systea_area_type: string | null
          systea_carga_horaria_atendimentos: number | null
          systea_carga_horaria_semanal_total: number | null
          systea_is_shutdown: boolean
          systea_local_trabalho: string | null
          systea_primeiro_dia_trabalho: string | null
          systea_regime_contratacao: string | null
          systea_sector_id: number | null
          systea_status: string | null
          systea_synced_at: string | null
          systea_updated_at: string | null
          systea_user_id: number | null
          telefone: string | null
          tipo_colaborador: string
          updated_at: string
        }
        Insert: {
          cargo: string
          cpf?: string | null
          created_at?: string
          custo_mensal?: number | null
          data_admissao: string
          data_desligamento?: string | null
          data_nascimento?: string | null
          departamento: string
          email?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string
          is_lider?: boolean | null
          nome: string
          salario_base?: number | null
          status?: string | null
          systea_admin_id?: number | null
          systea_area_name?: string | null
          systea_area_operation_id?: number | null
          systea_area_type?: string | null
          systea_carga_horaria_atendimentos?: number | null
          systea_carga_horaria_semanal_total?: number | null
          systea_is_shutdown?: boolean
          systea_local_trabalho?: string | null
          systea_primeiro_dia_trabalho?: string | null
          systea_regime_contratacao?: string | null
          systea_sector_id?: number | null
          systea_status?: string | null
          systea_synced_at?: string | null
          systea_updated_at?: string | null
          systea_user_id?: number | null
          telefone?: string | null
          tipo_colaborador: string
          updated_at?: string
        }
        Update: {
          cargo?: string
          cpf?: string | null
          created_at?: string
          custo_mensal?: number | null
          data_admissao?: string
          data_desligamento?: string | null
          data_nascimento?: string | null
          departamento?: string
          email?: string | null
          filial_id?: string | null
          genero?: string | null
          id?: string
          is_lider?: boolean | null
          nome?: string
          salario_base?: number | null
          status?: string | null
          systea_admin_id?: number | null
          systea_area_name?: string | null
          systea_area_operation_id?: number | null
          systea_area_type?: string | null
          systea_carga_horaria_atendimentos?: number | null
          systea_carga_horaria_semanal_total?: number | null
          systea_is_shutdown?: boolean
          systea_local_trabalho?: string | null
          systea_primeiro_dia_trabalho?: string | null
          systea_regime_contratacao?: string | null
          systea_sector_id?: number | null
          systea_status?: string | null
          systea_synced_at?: string | null
          systea_updated_at?: string | null
          systea_user_id?: number | null
          telefone?: string | null
          tipo_colaborador?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      contratacoes: {
        Row: {
          colaborador_id: string | null
          created_at: string
          data_contratacao: string
          filial_id: string | null
          id: string
          observacoes: string | null
          salario_inicial: number | null
          tipo_contratacao: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          data_contratacao: string
          filial_id?: string | null
          id?: string
          observacoes?: string | null
          salario_inicial?: number | null
          tipo_contratacao?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          data_contratacao?: string
          filial_id?: string | null
          id?: string
          observacoes?: string | null
          salario_inicial?: number | null
          tipo_contratacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratacoes_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      desligamentos: {
        Row: {
          colaborador_id: string | null
          created_at: string
          custo_rescisao: number | null
          data_desligamento: string
          id: string
          motivo: string
          observacoes: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          custo_rescisao?: number | null
          data_desligamento: string
          id?: string
          motivo: string
          observacoes?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          custo_rescisao?: number | null
          data_desligamento?: string
          id?: string
          motivo?: string
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "desligamentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_participacoes: {
        Row: {
          colaborador_id: string | null
          compareceu: boolean | null
          confirmou_presenca: boolean | null
          created_at: string
          evento_id: string | null
          id: string
        }
        Insert: {
          colaborador_id?: string | null
          compareceu?: boolean | null
          confirmou_presenca?: boolean | null
          created_at?: string
          evento_id?: string | null
          id?: string
        }
        Update: {
          colaborador_id?: string | null
          compareceu?: boolean | null
          confirmou_presenca?: boolean | null
          created_at?: string
          evento_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_participacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_participacoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          capacidade: number | null
          created_at: string
          data_evento: string
          descricao: string | null
          filial_id: string | null
          finalizado: boolean | null
          id: string
          nome: string
          tipo: string | null
        }
        Insert: {
          capacidade?: number | null
          created_at?: string
          data_evento: string
          descricao?: string | null
          filial_id?: string | null
          finalizado?: boolean | null
          id?: string
          nome: string
          tipo?: string | null
        }
        Update: {
          capacidade?: number | null
          created_at?: string
          data_evento?: string
          descricao?: string | null
          filial_id?: string | null
          finalizado?: boolean | null
          id?: string
          nome?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      filiais: {
        Row: {
          ativo: boolean | null
          cidade: string | null
          codigo: string
          created_at: string
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cidade?: string | null
          codigo: string
          created_at?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cidade?: string | null
          codigo?: string
          created_at?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_events: {
        Row: {
          attachment_url: string | null
          created_at: string
          employee_id: string | null
          employee_name: string
          end_date: string | null
          id: string
          notes: string
          reason: string
          sector_id: string | null
          sector_name: string
          start_date: string
          type: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string
          end_date?: string | null
          id?: string
          notes?: string
          reason?: string
          sector_id?: string | null
          sector_name?: string
          start_date: string
          type: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string
          end_date?: string | null
          id?: string
          notes?: string
          reason?: string
          sector_id?: string | null
          sector_name?: string
          start_date?: string
          type?: string
        }
        Relationships: []
      }
      institutional_events: {
        Row: {
          attachments: Json
          audit_trail: Json
          created_at: string
          description: string | null
          estimated_participants: number | null
          event_date: string
          id: string
          location: string | null
          organizer: string | null
          sectors: string[]
          tags: string[]
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          audit_trail?: Json
          created_at?: string
          description?: string | null
          estimated_participants?: number | null
          event_date: string
          id?: string
          location?: string | null
          organizer?: string | null
          sectors?: string[]
          tags?: string[]
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          audit_trail?: Json
          created_at?: string
          description?: string | null
          estimated_participants?: number | null
          event_date?: string
          id?: string
          location?: string | null
          organizer?: string | null
          sectors?: string[]
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lideres_formados: {
        Row: {
          colaborador_id: string | null
          created_at: string
          data_formacao: string
          id: string
          nivel: string | null
          observacoes: string | null
          programa_lideranca: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          data_formacao: string
          id?: string
          nivel?: string | null
          observacoes?: string | null
          programa_lideranca?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          data_formacao?: string
          id?: string
          nivel?: string | null
          observacoes?: string | null
          programa_lideranca?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lideres_formados_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          colaborador_id: string | null
          created_at: string
          data: string
          id: string
          lida: boolean
          mensagem: string
          prioridade: string
          tipo: string
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          data?: string
          id?: string
          lida?: boolean
          mensagem: string
          prioridade?: string
          tipo: string
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          data?: string
          id?: string
          lida?: boolean
          mensagem?: string
          prioridade?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_goals: {
        Row: {
          absenteeism_target: number
          created_at: string
          id: string
          scope_key: string
          turnover_target: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          absenteeism_target?: number
          created_at?: string
          id?: string
          scope_key: string
          turnover_target?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          absenteeism_target?: number
          created_at?: string
          id?: string
          scope_key?: string
          turnover_target?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      smart_notification_state: {
        Row: {
          created_at: string
          hidden: boolean
          hidden_at: string | null
          id: string
          notification_id: string
          read: boolean
          read_at: string | null
          semantic_key: string
          updated_at: string
          user_key: string
        }
        Insert: {
          created_at?: string
          hidden?: boolean
          hidden_at?: string | null
          id?: string
          notification_id: string
          read?: boolean
          read_at?: string | null
          semantic_key: string
          updated_at?: string
          user_key: string
        }
        Update: {
          created_at?: string
          hidden?: boolean
          hidden_at?: string | null
          id?: string
          notification_id?: string
          read?: boolean
          read_at?: string | null
          semantic_key?: string
          updated_at?: string
          user_key?: string
        }
        Relationships: []
      }
      systea_clinic_filiais: {
        Row: {
          created_at: string
          filial_id: string
          systea_clinic_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          filial_id: string
          systea_clinic_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          filial_id?: string
          systea_clinic_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "systea_clinic_filiais_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: true
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      systea_sync_admins: {
        Row: {
          active: boolean
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      systea_sync_runs: {
        Row: {
          created: number
          error_summary: string | null
          errors: number
          fetched: number
          finished_at: string | null
          id: string
          last_page: number | null
          lock_token: string | null
          locked_at: string | null
          mode: string
          next_page: number
          processed: number
          requested_by: string | null
          resumable: boolean
          skipped: number
          started_at: string
          status: string
          total: number
          unchanged: number
          updated: number
        }
        Insert: {
          created?: number
          error_summary?: string | null
          errors?: number
          fetched?: number
          finished_at?: string | null
          id?: string
          last_page?: number | null
          lock_token?: string | null
          locked_at?: string | null
          mode: string
          next_page?: number
          processed?: number
          requested_by?: string | null
          resumable?: boolean
          skipped?: number
          started_at?: string
          status: string
          total?: number
          unchanged?: number
          updated?: number
        }
        Update: {
          created?: number
          error_summary?: string | null
          errors?: number
          fetched?: number
          finished_at?: string | null
          id?: string
          last_page?: number | null
          lock_token?: string | null
          locked_at?: string | null
          mode?: string
          next_page?: number
          processed?: number
          requested_by?: string | null
          resumable?: boolean
          skipped?: number
          started_at?: string
          status?: string
          total?: number
          unchanged?: number
          updated?: number
        }
        Relationships: []
      }
      training_extras: {
        Row: {
          attachments: Json
          audit_trail: Json
          created_at: string
          id: string
          snapshot: Json | null
          tags: string[]
          training_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          audit_trail?: Json
          created_at?: string
          id?: string
          snapshot?: Json | null
          tags?: string[]
          training_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          audit_trail?: Json
          created_at?: string
          id?: string
          snapshot?: Json | null
          tags?: string[]
          training_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      treinamento_participacoes: {
        Row: {
          certificado_emitido: boolean | null
          colaborador_id: string | null
          created_at: string
          id: string
          nota_avaliacao: number | null
          participou: boolean | null
          treinamento_id: string | null
        }
        Insert: {
          certificado_emitido?: boolean | null
          colaborador_id?: string | null
          created_at?: string
          id?: string
          nota_avaliacao?: number | null
          participou?: boolean | null
          treinamento_id?: string | null
        }
        Update: {
          certificado_emitido?: boolean | null
          colaborador_id?: string | null
          created_at?: string
          id?: string
          nota_avaliacao?: number | null
          participou?: boolean | null
          treinamento_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_participacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamento_participacoes_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamentos: {
        Row: {
          carga_horaria: number | null
          created_at: string
          data_realizacao: string
          descricao: string | null
          filial_id: string | null
          finalizado: boolean | null
          id: string
          nome: string
          tipo: string | null
          vagas_totais: number
        }
        Insert: {
          carga_horaria?: number | null
          created_at?: string
          data_realizacao: string
          descricao?: string | null
          filial_id?: string | null
          finalizado?: boolean | null
          id?: string
          nome: string
          tipo?: string | null
          vagas_totais?: number
        }
        Update: {
          carga_horaria?: number | null
          created_at?: string
          data_realizacao?: string
          descricao?: string | null
          filial_id?: string | null
          finalizado?: boolean | null
          id?: string
          nome?: string
          tipo?: string | null
          vagas_totais?: number
        }
        Relationships: [
          {
            foreignKeyName: "treinamentos_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_systea_colaboradores: {
        Args: { payloads: Json }
        Returns: undefined
      }
      claim_systea_sync_batch: {
        Args: { p_mode: string; p_requested_by: string }
        Returns: {
          busy: boolean
          created: number
          errors: number
          fetched: number
          id: string
          last_page: number
          lock_token: string
          next_page: number
          processed: number
          skipped: number
          total: number
          unchanged: number
          updated: number
        }[]
      }
      fail_systea_sync_batch: {
        Args: {
          p_error_summary: string
          p_lock_token: string
          p_run_id: string
        }
        Returns: undefined
      }
      finish_systea_sync_batch: {
        Args: {
          p_created_increment: number
          p_last_page: number
          p_lock_token: string
          p_processed_increment: number
          p_run_id: string
          p_skipped_increment: number
          p_total: number
          p_unchanged_increment: number
          p_updated_increment: number
        }
        Returns: {
          created: number
          error_summary: string | null
          errors: number
          fetched: number
          finished_at: string | null
          id: string
          last_page: number | null
          lock_token: string | null
          locked_at: string | null
          mode: string
          next_page: number
          processed: number
          requested_by: string | null
          resumable: boolean
          skipped: number
          started_at: string
          status: string
          total: number
          unchanged: number
          updated: number
        }
        SetofOptions: {
          from: "*"
          to: "systea_sync_runs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reconcile_systea_colaborador_filiais: {
        Args: {
          p_colaborador_id: string
          p_synced_at?: string
          p_systea_clinic_ids: number[]
        }
        Returns: number
      }
      sync_systea_colaborador_filiais: {
        Args: {
          p_colaborador_id: string
          p_synced_at?: string
          p_systea_clinic_ids: number[]
        }
        Returns: undefined
      }
      sync_systea_colaborador_filiais_batch: {
        Args: { p_assignments: Json; p_synced_at?: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
