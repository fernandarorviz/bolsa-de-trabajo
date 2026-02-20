-- Enum para roles de aplicación
CREATE TYPE public.app_role AS ENUM ('admin', 'coordinador', 'reclutador', 'ejecutivo');

-- Enum para estados de vacante
CREATE TYPE public.estado_vacante AS ENUM ('borrador', 'publicada', 'pausada', 'archivada', 'cerrada');

-- Enum para tipo de contrato
CREATE TYPE public.tipo_contrato AS ENUM ('tiempo_completo', 'medio_tiempo', 'temporal', 'proyecto', 'freelance');

-- Enum para prioridad
CREATE TYPE public.prioridad_vacante AS ENUM ('baja', 'media', 'alta', 'urgente');

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'reclutador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabla de clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  industria TEXT,
  contacto_nombre TEXT,
  contacto_email TEXT,
  contacto_telefono TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de etapas del pipeline
CREATE TABLE public.etapas_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  es_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar etapas base del pipeline
INSERT INTO public.etapas_pipeline (nombre, orden, color, es_final) VALUES
  ('Postulado', 1, '#94a3b8', false),
  ('CV Revisado', 2, '#60a5fa', false),
  ('Entrevista Interna', 3, '#a78bfa', false),
  ('Evaluaciones', 4, '#fbbf24', false),
  ('Entrevista Cliente', 5, '#fb923c', false),
  ('Finalista', 6, '#4ade80', false),
  ('Contratado', 7, '#22c55e', true);

-- Tabla de vacantes
CREATE TABLE public.vacantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  ubicacion TEXT,
  area TEXT,
  tipo_contrato tipo_contrato NOT NULL DEFAULT 'tiempo_completo',
  estado estado_vacante NOT NULL DEFAULT 'borrador',
  prioridad prioridad_vacante NOT NULL DEFAULT 'media',
  salario_min NUMERIC,
  salario_max NUMERIC,
  reclutador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ejecutivo_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_publicacion TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,
  candidato_contratado_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de candidatos
CREATE TABLE public.candidatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  ubicacion TEXT,
  cv_url TEXT,
  linkedin_url TEXT,
  estado_general TEXT DEFAULT 'activo',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de postulaciones (relación vacante-candidato)
CREATE TABLE public.postulaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  etapa_id UUID NOT NULL REFERENCES public.etapas_pipeline(id),
  fecha_postulacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  descartado BOOLEAN NOT NULL DEFAULT false,
  motivo_descarte TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vacante_id, candidato_id)
);

-- Historial de etapas
CREATE TABLE public.historial_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postulacion_id UUID NOT NULL REFERENCES public.postulaciones(id) ON DELETE CASCADE,
  etapa_id UUID NOT NULL REFERENCES public.etapas_pipeline(id),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  movido_por_usuario UUID REFERENCES auth.users(id),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agregar referencia del candidato contratado
ALTER TABLE public.vacantes 
ADD CONSTRAINT fk_candidato_contratado 
FOREIGN KEY (candidato_contratado_id) REFERENCES public.candidatos(id) ON DELETE SET NULL;

-- Función para verificar roles (security definer para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Función para verificar si usuario tiene algún rol
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$$;

-- Función para obtener el rol del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vacantes_updated_at BEFORE UPDATE ON public.vacantes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidatos_updated_at BEFORE UPDATE ON public.candidatos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear historial de etapa automáticamente
CREATE OR REPLACE FUNCTION public.create_initial_historial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.historial_etapas (postulacion_id, etapa_id, movido_por_usuario)
  VALUES (NEW.id, NEW.etapa_id, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_historial_on_postulacion
AFTER INSERT ON public.postulaciones
FOR EACH ROW EXECUTE FUNCTION public.create_initial_historial();

-- Trigger para registrar cambios de etapa
CREATE OR REPLACE FUNCTION public.update_historial_on_etapa_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.etapa_id != NEW.etapa_id THEN
    -- Cerrar etapa anterior
    UPDATE public.historial_etapas 
    SET fecha_fin = now()
    WHERE postulacion_id = NEW.id AND fecha_fin IS NULL;
    
    -- Crear nueva entrada
    INSERT INTO public.historial_etapas (postulacion_id, etapa_id, movido_por_usuario)
    VALUES (NEW.id, NEW.etapa_id, auth.uid());
    
    -- Actualizar fecha de última actualización
    NEW.fecha_ultima_actualizacion = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_historial_on_etapa_change
BEFORE UPDATE ON public.postulaciones
FOR EACH ROW EXECUTE FUNCTION public.update_historial_on_etapa_change();

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postulaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_etapas ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profiles
CREATE POLICY "Usuarios pueden ver todos los perfiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- RLS Policies para user_roles
CREATE POLICY "Usuarios pueden ver roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Solo admin puede gestionar roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para clientes
CREATE POLICY "Usuarios autenticados pueden ver clientes"
ON public.clientes FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Reclutadores y superiores pueden gestionar clientes"
ON public.clientes FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinador') OR 
  public.has_role(auth.uid(), 'reclutador')
);

-- RLS Policies para etapas_pipeline
CREATE POLICY "Usuarios pueden ver etapas"
ON public.etapas_pipeline FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Solo admin puede gestionar etapas"
ON public.etapas_pipeline FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para vacantes
CREATE POLICY "Usuarios autenticados pueden ver vacantes"
ON public.vacantes FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Reclutadores pueden crear vacantes"
ON public.vacantes FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinador') OR 
  public.has_role(auth.uid(), 'reclutador')
);

CREATE POLICY "Reclutadores pueden editar vacantes asignadas"
ON public.vacantes FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinador') OR 
  (public.has_role(auth.uid(), 'reclutador') AND reclutador_id = auth.uid())
);

CREATE POLICY "Solo coordinador y admin pueden eliminar vacantes"
ON public.vacantes FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinador')
);

-- RLS Policies para candidatos
CREATE POLICY "Usuarios autenticados pueden ver candidatos"
ON public.candidatos FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Reclutadores pueden gestionar candidatos"
ON public.candidatos FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinador') OR 
  public.has_role(auth.uid(), 'reclutador')
);

-- RLS Policies para postulaciones
CREATE POLICY "Usuarios autenticados pueden ver postulaciones"
ON public.postulaciones FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Reclutadores pueden gestionar postulaciones"
ON public.postulaciones FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinador') OR 
  public.has_role(auth.uid(), 'reclutador')
);

-- RLS Policies para historial_etapas
CREATE POLICY "Usuarios autenticados pueden ver historial"
ON public.historial_etapas FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Reclutadores pueden crear historial"
ON public.historial_etapas FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinador') OR 
  public.has_role(auth.uid(), 'reclutador')
);