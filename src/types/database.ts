// Database types for the HR system

export interface Filial {
  id: string;
  nome: string;
  codigo: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  genero?: 'Masculino' | 'Feminino' | 'Outro';
  cargo: string;
  departamento: string;
  filial_id?: string;
  tipo_colaborador: 'CLT Administrativo' | 'CLT Corpo Clínico' | 'PJ' | 'Estagiário';
  data_admissao: string;
  data_desligamento?: string;
  salario_base?: number;
  custo_mensal?: number;
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Férias';
  is_lider: boolean;
  created_at: string;
  updated_at: string;
  filial?: Filial;
}

export interface Desligamento {
  id: string;
  colaborador_id: string;
  data_desligamento: string;
  motivo: 'Pedido de demissão' | 'Iniciativa da empresa' | 'Término de contrato';
  custo_rescisao?: number;
  observacoes?: string;
  created_at: string;
  colaborador?: Colaborador;
}

export interface Afastamento {
  id: string;
  colaborador_id: string;
  tipo: 'Atestado médico' | 'Banco de horas' | 'Férias' | 'Licença maternidade' | 'Licença paternidade' | 'Outro';
  data_inicio: string;
  data_fim: string;
  dias_afastados: number;
  observacoes?: string;
  anexo_url?: string;
  created_at: string;
  colaborador?: Colaborador;
}

export interface Treinamento {
  id: string;
  nome: string;
  descricao?: string;
  data_realizacao: string;
  carga_horaria?: number;
  filial_id?: string;
  tipo?: 'Presencial' | 'Online' | 'Híbrido';
  vagas_totais: number;
  setor_alvo?: string;
  responsavel?: string;
  finalizado?: boolean;
  created_at: string;
  filial?: Filial;
}

export interface TreinamentoParticipacao {
  id: string;
  treinamento_id: string;
  colaborador_id: string;
  participou: boolean;
  nota_avaliacao?: number;
  certificado_emitido: boolean;
  created_at: string;
  treinamento?: Treinamento;
  colaborador?: Colaborador;
}

export interface Evento {
  id: string;
  nome: string;
  descricao?: string;
  data_evento: string;
  filial_id?: string;
  tipo?: string;
  setor_alvo?: string;
  responsavel?: string;
  capacidade?: number;
  finalizado?: boolean;
  created_at: string;
  filial?: Filial;
}

export interface EventoParticipacao {
  id: string;
  evento_id: string;
  colaborador_id: string;
  confirmou_presenca: boolean;
  compareceu: boolean;
  created_at: string;
  evento?: Evento;
  colaborador?: Colaborador;
}

export interface LiderFormado {
  id: string;
  colaborador_id: string;
  data_formacao: string;
  programa_lideranca?: string;
  nivel?: 'Supervisor' | 'Coordenador' | 'Gerente' | 'Diretor';
  observacoes?: string;
  created_at: string;
  colaborador?: Colaborador;
}

export interface Contratacao {
  id: string;
  colaborador_id: string;
  data_contratacao: string;
  tipo_contratacao?: 'Nova contratação' | 'Readmissão' | 'Transferência';
  salario_inicial?: number;
  filial_id?: string;
  observacoes?: string;
  created_at: string;
  colaborador?: Colaborador;
  filial?: Filial;
}
