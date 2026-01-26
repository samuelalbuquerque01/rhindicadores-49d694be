
-- Tabela de Filiais/Unidades
CREATE TABLE public.filiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Colaboradores (completa)
CREATE TABLE public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  genero TEXT CHECK (genero IN ('Masculino', 'Feminino', 'Outro')),
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  filial_id UUID REFERENCES public.filiais(id),
  tipo_colaborador TEXT NOT NULL CHECK (tipo_colaborador IN ('CLT Administrativo', 'CLT Corpo Clínico', 'PJ', 'Estagiário')),
  data_admissao DATE NOT NULL,
  data_desligamento DATE,
  salario_base DECIMAL(12,2),
  custo_mensal DECIMAL(12,2),
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Afastado', 'Férias')),
  is_lider BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Desligamentos
CREATE TABLE public.desligamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data_desligamento DATE NOT NULL,
  motivo TEXT NOT NULL CHECK (motivo IN ('Pedido de demissão', 'Iniciativa da empresa', 'Término de contrato')),
  custo_rescisao DECIMAL(12,2),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Afastamentos
CREATE TABLE public.afastamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('Atestado médico', 'Banco de horas', 'Férias', 'Licença maternidade', 'Licença paternidade', 'Outro')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_afastados INTEGER GENERATED ALWAYS AS (data_fim - data_inicio + 1) STORED,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Treinamentos
CREATE TABLE public.treinamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_realizacao DATE NOT NULL,
  carga_horaria INTEGER,
  filial_id UUID REFERENCES public.filiais(id),
  tipo TEXT CHECK (tipo IN ('Presencial', 'Online', 'Híbrido')),
  vagas_totais INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Participação em Treinamentos
CREATE TABLE public.treinamento_participacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  participou BOOLEAN DEFAULT false,
  nota_avaliacao DECIMAL(3,1),
  certificado_emitido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(treinamento_id, colaborador_id)
);

-- Tabela de Eventos
CREATE TABLE public.eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_evento DATE NOT NULL,
  filial_id UUID REFERENCES public.filiais(id),
  tipo TEXT CHECK (tipo IN ('Confraternização', 'Palestra', 'Workshop', 'Integração', 'Outro')),
  capacidade INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Participação em Eventos
CREATE TABLE public.evento_participacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  confirmou_presenca BOOLEAN DEFAULT false,
  compareceu BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(evento_id, colaborador_id)
);

-- Tabela de Formação de Líderes
CREATE TABLE public.lideres_formados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data_formacao DATE NOT NULL,
  programa_lideranca TEXT,
  nivel TEXT CHECK (nivel IN ('Supervisor', 'Coordenador', 'Gerente', 'Diretor')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Contratações (para histórico)
CREATE TABLE public.contratacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data_contratacao DATE NOT NULL,
  tipo_contratacao TEXT CHECK (tipo_contratacao IN ('Nova contratação', 'Readmissão', 'Transferência')),
  salario_inicial DECIMAL(12,2),
  filial_id UUID REFERENCES public.filiais(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desligamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_participacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_participacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lideres_formados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (para MVP sem autenticação)
CREATE POLICY "Acesso público filiais" ON public.filiais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público colaboradores" ON public.colaboradores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público desligamentos" ON public.desligamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público afastamentos" ON public.afastamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público treinamentos" ON public.treinamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público treinamento_participacoes" ON public.treinamento_participacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público eventos" ON public.eventos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público evento_participacoes" ON public.evento_participacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público lideres_formados" ON public.lideres_formados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público contratacoes" ON public.contratacoes FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_filiais_updated_at BEFORE UPDATE ON public.filiais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_colaboradores_filial ON public.colaboradores(filial_id);
CREATE INDEX idx_colaboradores_tipo ON public.colaboradores(tipo_colaborador);
CREATE INDEX idx_colaboradores_status ON public.colaboradores(status);
CREATE INDEX idx_afastamentos_tipo ON public.afastamentos(tipo);
CREATE INDEX idx_desligamentos_motivo ON public.desligamentos(motivo);
CREATE INDEX idx_treinamentos_data ON public.treinamentos(data_realizacao);
CREATE INDEX idx_eventos_data ON public.eventos(data_evento);
