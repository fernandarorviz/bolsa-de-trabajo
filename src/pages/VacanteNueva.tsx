
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import KnockoutQuestionsTab from '@/components/vacancies/KnockoutQuestionsTab';
import { LoadTemplateDialog } from '@/components/vacancies/LoadTemplateDialog';
import type { TipoContrato, PrioridadVacante, Vacante, KnockoutQuestion, ClasificacionVacante, VacancyTemplate } from '@/types/ats';

export default function VacanteNueva() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateFromId = searchParams.get('from');
  const isEditing = !!id;
  const isDuplicating = !!duplicateFromId;
  const [openRecruiters, setOpenRecruiters] = useState(false);
  const [openClientes, setOpenClientes] = useState(false);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [shouldRegisterAnother, setShouldRegisterAnother] = useState(false);
  // Add state for travel availability
  const [disponibilidadViaje, setDisponibilidadViaje] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [area, setArea] = useState('');
  const [posiciones, setPosiciones] = useState(1);
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>("tiempo_completo");
  const [prioridad, setPrioridad] = useState<PrioridadVacante>("media");
  const [clasificacion, setClasificacion] = useState<ClasificacionVacante>("administrativa");
  const [salarioMin, setSalarioMin] = useState<string>('');
  const [salarioMax, setSalarioMax] = useState<string>('');
  const [genero, setGenero] = useState<string>("indistinto");
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [nivelEducativoMin, setNivelEducativoMin] = useState('licenciatura');
  const [carrera, setCarrera] = useState('');
  const [estatusCarrera, setEstatusCarrera] = useState('titulado');
  const [aniosExperienciaMin, setAniosExperienciaMin] = useState<string>('');
  const [salarioMensualBruto, setSalarioMensualBruto] = useState<string>('');
  const [monedaSalario, setMonedaSalario] = useState('MXN');
  const [periodoPago, setPeriodoPago] = useState('mensual');
  const [prestaciones, setPrestaciones] = useState('');
  const [requiereAnticipo, setRequiereAnticipo] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [descripcionPrestaciones, setDescripcionPrestaciones] = useState('');
  const [beneficiosAdicionales, setBeneficiosAdicionales] = useState('');
  const [bonos, setBonos] = useState('');
  const [herramientasTrabajo, setHerramientasTrabajo] = useState('');
  // Add state for age range
  const [rangoEdad, setRangoEdad] = useState<number[]>([18, 55]);
  // Add state for education/skills rich text fields
  const [competenciasClave, setCompetenciasClave] = useState('');
  const [idiomasRequeridos, setIdiomasRequeridos] = useState('');
  const [actividadesIdiomas, setActividadesIdiomas] = useState('');
  const [conocimientosTecnicos, setConocimientosTecnicos] = useState('');
  const [experienciaRequerida, setExperienciaRequerida] = useState('');
  const [habilidadesTecnicas, setHabilidadesTecnicas] = useState('');
  const [preguntasKnockout, setPreguntasKnockout] = useState<KnockoutQuestion[]>([]);

  const handleLoadTemplate = (template: VacancyTemplate) => {
    if (template.titulo) setTitulo(template.titulo);
    if (template.descripcion) setDescripcion(template.descripcion);
    if (template.ubicacion) setUbicacion(template.ubicacion);
    if (template.area) setArea(template.area);
    if (template.tipo_contrato) setTipoContrato(template.tipo_contrato);
    if (template.prioridad) setPrioridad(template.prioridad);
    if (template.clasificacion) setClasificacion(template.clasificacion);
    if (template.salario_min) setSalarioMin(template.salario_min.toString());
    if (template.salario_max) setSalarioMax(template.salario_max.toString());
    if (template.requiere_anticipo !== undefined) setRequiereAnticipo(template.requiere_anticipo);
    if (template.posiciones) setPosiciones(template.posiciones);
    if (template.rango_edad_min && template.rango_edad_max) setRangoEdad([template.rango_edad_min, template.rango_edad_max]);
    if (template.genero) setGenero(template.genero);
    if (template.disponibilidad_viaje !== undefined) setDisponibilidadViaje(template.disponibilidad_viaje);
    if (template.categoria) setCategoria(template.categoria);
    if (template.subcategoria) setSubcategoria(template.subcategoria);
    if (template.nivel_educativo_min) setNivelEducativoMin(template.nivel_educativo_min);
    if (template.carrera) setCarrera(template.carrera);
    if (template.estatus_carrera) setEstatusCarrera(template.estatus_carrera);
    if (template.anios_experiencia_min) setAniosExperienciaMin(template.anios_experiencia_min.toString());
    if (template.idiomas_requeridos) setIdiomasRequeridos(template.idiomas_requeridos);
    if (template.actividades_idiomas) setActividadesIdiomas(template.actividades_idiomas);
    if (template.conocimientos_tecnicos) setConocimientosTecnicos(template.conocimientos_tecnicos);
    if (template.experiencia_requerida) setExperienciaRequerida(template.experiencia_requerida);
    if (template.habilidades_tecnicas) setHabilidadesTecnicas(template.habilidades_tecnicas);
    if (template.competencias_clave) setCompetenciasClave(template.competencias_clave);
    if (template.salario_mensual_bruto) setSalarioMensualBruto(template.salario_mensual_bruto.toString());
    if (template.moneda_salario) setMonedaSalario(template.moneda_salario);
    if (template.periodo_pago) setPeriodoPago(template.periodo_pago);
    if (template.prestaciones) setPrestaciones(template.prestaciones);
    if (template.descripcion_prestaciones) setDescripcionPrestaciones(template.descripcion_prestaciones);
    if (template.beneficios_adicionales) setBeneficiosAdicionales(template.beneficios_adicionales);
    if (template.bonos) setBonos(template.bonos);
    if (template.herramientas_trabajo) setHerramientasTrabajo(template.herramientas_trabajo);
    if (template.preguntas_knockout) setPreguntasKnockout(template.preguntas_knockout);
    if (template.cliente_id) setSelectedClientId(template.cliente_id);
    
    toast.success("Plantilla cargada exitosamente");
  };

  const { data: vacante, isLoading: isLoadingVacante } = useQuery({
    queryKey: ['vacante', id || duplicateFromId],
    queryFn: async () => {
      const targetId = id || duplicateFromId;
      if (!targetId) return null;
      const { data, error } = await supabase
        .from('vacantes')
        .select('*')
        .eq('id', targetId)
        .single();
      if (error) throw error;
      return data as unknown as Vacante;
    },
    enabled: isEditing || isDuplicating,
  });

  useEffect(() => {
    if (vacante) {
      if (vacante.reclutador_id) {
        setSelectedRecruiterId(vacante.reclutador_id);
      }
      if (vacante.cliente_id) {
        setSelectedClientId(vacante.cliente_id);
      }
      if (vacante.disponibilidad_viaje !== undefined) {
        setDisponibilidadViaje(vacante.disponibilidad_viaje);
      }
      setDescripcion(vacante.descripcion || '');
      setDescripcionPrestaciones(vacante.descripcion_prestaciones || '');
      setBeneficiosAdicionales(vacante.beneficios_adicionales || '');
      setBonos(vacante.bonos || '');
      setHerramientasTrabajo(vacante.herramientas_trabajo || '');
      setCompetenciasClave(vacante.competencias_clave || '');
      setIdiomasRequeridos(vacante.idiomas_requeridos || '');
      setActividadesIdiomas(vacante.actividades_idiomas || '');
      setConocimientosTecnicos(vacante.conocimientos_tecnicos || '');
      setExperienciaRequerida(vacante.experiencia_requerida || '');
      setHabilidadesTecnicas(vacante.habilidades_tecnicas || '');
      setTitulo(isDuplicating ? `Copia de ${vacante.titulo}` : (vacante.titulo || ''));
      setUbicacion(vacante.ubicacion || '');
      setArea(vacante.area || '');
      setPosiciones(vacante.posiciones || 1);
      setTipoContrato(vacante.tipo_contrato || "tiempo_completo");
      setPrioridad(vacante.prioridad || "media");
      setClasificacion(vacante.clasificacion || "administrativa");
      setSalarioMin(vacante.salario_min?.toString() || '');
      setSalarioMax(vacante.salario_max?.toString() || '');
      setGenero(vacante.genero || "indistinto");
      setCategoria(vacante.categoria || '');
      setSubcategoria(vacante.subcategoria || '');
      setNivelEducativoMin(vacante.nivel_educativo_min || 'licenciatura');
      setCarrera(vacante.carrera || '');
      setEstatusCarrera(vacante.estatus_carrera || 'titulado');
      setAniosExperienciaMin(vacante.anios_experiencia_min?.toString() || '');
      setSalarioMensualBruto(vacante.salario_mensual_bruto?.toString() || '');
      setMonedaSalario((vacante as any).moneda_salario || "MXN");
      setPeriodoPago((vacante as any).periodo_pago || "mensual");
      setPrestaciones((vacante as any).prestaciones || '');
      setRequiereAnticipo(vacante.requiere_anticipo || false);
      if (vacante.preguntas_knockout) {
        setPreguntasKnockout(vacante.preguntas_knockout as KnockoutQuestion[]);
      }
      // Update age range from vacancy data
      if (vacante.rango_edad_min !== undefined || (vacante as any).rango_edad_max !== undefined) {
        setRangoEdad([
          (vacante as any).rango_edad_min || 18,
          (vacante as any).rango_edad_max || 55
        ]);
      }
    } else if (user?.id) {
      setSelectedRecruiterId(user.id);
    }
  }, [vacante, user]);

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios', 'reclutador'],
    queryFn: async () => {
      // 1. Obtener IDs de usuarios con rol de reclutador
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'reclutador');
      
      if (roleError) throw roleError;
      
      const userIds = roleData.map(r => r.user_id);
      
      if (userIds.length === 0) return [];

      // 2. Obtener perfiles para esos IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, email')
        .in('id', userIds)
        .order('nombre');
      
      if (profilesError) throw profilesError;
      return profilesData;
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const data = {
      titulo: titulo,
      descripcion: descripcion || null,
      cliente_id: selectedClientId || null,
      ubicacion: ubicacion || null,
      area: area || null,
      tipo_contrato: tipoContrato,
      prioridad: prioridad,
      clasificacion: clasificacion,
      salario_min: salarioMin ? Number(salarioMin) : null,
      salario_max: salarioMax ? Number(salarioMax) : null,
      reclutador_id: selectedRecruiterId || user?.id || null,
      ejecutivo_id: null,
      requiere_anticipo: requiereAnticipo,
      posiciones: posiciones,
      // New fields
      rango_edad_min: rangoEdad[0],
      rango_edad_max: rangoEdad[1],
      genero: genero as any || null,
      disponibilidad_viaje: disponibilidadViaje,
      categoria: categoria || null,
      subcategoria: subcategoria || null,
      nivel_educativo_min: nivelEducativoMin || null,
      carrera: carrera || null,
      estatus_carrera: estatusCarrera || null,
      anios_experiencia_min: aniosExperienciaMin ? Number(aniosExperienciaMin) : null,
      idiomas_requeridos: idiomasRequeridos || null,
      actividades_idiomas: actividadesIdiomas || null,
      conocimientos_tecnicos: conocimientosTecnicos || null,
      experiencia_requerida: experienciaRequerida || null,
      habilidades_tecnicas: habilidadesTecnicas || null,
      competencias_clave: competenciasClave || null,
      salario_mensual_bruto: salarioMensualBruto ? Number(salarioMensualBruto) : null,
      moneda_salario: monedaSalario as any || null,
      periodo_pago: periodoPago as any || null,
      prestaciones: prestaciones || null,
      descripcion_prestaciones: descripcionPrestaciones,
      beneficios_adicionales: beneficiosAdicionales,
      bonos: bonos,
      herramientas_trabajo: herramientasTrabajo,
      preguntas_knockout: (preguntasKnockout.length > 0 ? preguntasKnockout : null) as any,
    };

    try {
      let error;
      let vacanteData;

      if (isEditing) {
        const { data: updatedData, error: updateError } = await supabase
          .from('vacantes')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        error = updateError;
        vacanteData = updatedData;
      } else {
        const insertData = {
          ...data,
          estado: (data.requiere_anticipo ? 'pendiente_pago' : 'borrador') as any,
        };
        const { data: insertedData, error: insertError } = await supabase
          .from('vacantes')
          .insert(insertData)
          .select()
          .single();
        error = insertError;
        vacanteData = insertedData;
      }

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['vacantes'] });
      if (id) queryClient.invalidateQueries({ queryKey: ['vacante', id] });
      
      toast.success(isEditing ? 'Vacante actualizada exitosamente' : 'Vacante creada exitosamente');
      
      if (shouldRegisterAnother && !isEditing) {
        setShouldRegisterAnother(false);
        window.location.reload();
      } else {
        navigate(`/vacantes/${vacanteData.id}`);
      }
    } catch (error) {
      toast.error(isEditing ? 'Error al actualizar la vacante' : 'Error al crear la vacante', {
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if ((isEditing || isDuplicating) && isLoadingVacante) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vacantes')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Editar Vacante' : isDuplicating ? 'Duplicar Vacante' : 'Nueva Vacante'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditing 
                  ? 'Modifica la información de la posición' 
                  : isDuplicating
                  ? 'Crea una nueva vacante basada en una existente'
                  : 'Completa la información de la nueva posición'}
              </p>
            </div>
          </div>
          {!isEditing && <LoadTemplateDialog onSelectTemplate={handleLoadTemplate} />}
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="info-basica" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
              <TabsTrigger value="info-basica" className="py-2">Datos Básicos</TabsTrigger>
              <TabsTrigger value="sueldo-prestaciones" className="py-2">Sueldo y Beneficios</TabsTrigger>
              <TabsTrigger value="educacion-competencias" className="py-2">Habilidades y Perfil</TabsTrigger>
              <TabsTrigger value="preguntas-knockout" className="py-2">Preguntas Knockout</TabsTrigger>
            </TabsList>

            <TabsContent value="info-basica" className="space-y-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título del puesto *</Label>
                    <Input
                      id="titulo"
                      name="titulo"
                      placeholder="Ej: Desarrollador Full Stack Senior"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={descripcion} onChange={setDescripcion} placeholder="Describe las responsabilidades, requisitos y beneficios del puesto..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cliente_id">Cliente</Label>
                      <div className="flex flex-col">
                        <Popover open={openClientes} onOpenChange={setOpenClientes}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openClientes}
                              className="w-full justify-between"
                            >
                              {selectedClientId
                                ? clientes?.find((c) => c.id === selectedClientId)?.nombre
                                : "Seleccionar cliente..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Buscar cliente..." />
                              <CommandList>
                                <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                                <CommandGroup>
                                  {clientes?.map((cliente) => (
                                    <CommandItem
                                      key={cliente.id}
                                      value={cliente.nombre}
                                      onSelect={() => {
                                        setSelectedClientId(cliente.id);
                                        setOpenClientes(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedClientId === cliente.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {cliente.nombre}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <input type="hidden" name="cliente_id" value={selectedClientId} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ubicacion">Ubicación</Label>
                      <Input
                        id="ubicacion"
                        name="ubicacion"
                        placeholder="Ej: Ciudad de México, Remoto"
                        value={ubicacion}
                        onChange={(e) => setUbicacion(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area">Área</Label>
                      <Input
                        id="area"
                        name="area"
                        placeholder="Ej: Tecnología, Finanzas"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="posiciones">Número de posiciones *</Label>
                      <Input
                        id="posiciones"
                        name="posiciones"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={posiciones}
                        onChange={(e) => setPosiciones(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
                      <Select name="tipo_contrato" value={tipoContrato} onValueChange={(val: TipoContrato) => setTipoContrato(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tiempo_completo">Tiempo Completo</SelectItem>
                          <SelectItem value="medio_tiempo">Medio Tiempo</SelectItem>
                          <SelectItem value="temporal">Temporal</SelectItem>
                          <SelectItem value="proyecto">Por Proyecto</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prioridad">Prioridad *</Label>
                      <Select name="prioridad" value={prioridad} onValueChange={(val: PrioridadVacante) => setPrioridad(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clasificacion">Clasificación de Vacante *</Label>
                      <Select name="clasificacion" value={clasificacion || "administrativa"} onValueChange={(val: ClasificacionVacante) => setClasificacion(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operativa">Operativa</SelectItem>
                          <SelectItem value="administrativa">Administrativa</SelectItem>
                          <SelectItem value="gerencial">Gerencial</SelectItem>
                          <SelectItem value="directiva">Directiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salario_min">Salario Mínimo</Label>
                      <Input
                        id="salario_min"
                        name="salario_min"
                        type="number"
                        placeholder="0"
                        value={salarioMin}
                        onChange={(e) => setSalarioMin(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salario_max">Salario Máximo</Label>
                      <Input
                        id="salario_max"
                        name="salario_max"
                        type="number"
                        placeholder="0"
                        value={salarioMax}
                        onChange={(e) => setSalarioMax(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* New fields in Info Basica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label>Rango de edad</Label>
                        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          {rangoEdad[0]} - {rangoEdad[1]} años
                        </span>
                      </div>
                      <div className="px-2 pt-4 pb-8">
                        <Slider
                          value={rangoEdad}
                          onValueChange={setRangoEdad}
                          min={18}
                          max={85}
                          step={1}
                        />
                        <div className="flex justify-between mt-4 text-[10px] text-muted-foreground font-medium px-1">
                          {[18, 25, 35, 45, 55, 65, 75, 85].map((val) => (
                            <div key={val} className="flex flex-col items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-border" />
                              <span>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="genero">Género</Label>
                        <Select name="genero" value={genero} onValueChange={setGenero}>
                          <SelectTrigger>
                            <SelectValue placeholder="Indistinto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="femenino">Femenino</SelectItem>
                            <SelectItem value="indistinto">Indistinto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Switch 
                          id="disponibilidad_viaje" 
                          checked={disponibilidadViaje}
                          onCheckedChange={setDisponibilidadViaje}
                        />
                        <Label htmlFor="disponibilidad_viaje">Disponibilidad para viajar</Label>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Asignación */}
              <Card>
                <CardHeader>
                  <CardTitle>Asignación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reclutador_id">Reclutador</Label>
                      <div className="flex flex-col">
                        <Popover open={openRecruiters} onOpenChange={setOpenRecruiters}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openRecruiters}
                              className="w-full justify-between"
                            >
                              {selectedRecruiterId
                                ? usuarios?.find((u) => u.id === selectedRecruiterId)?.nombre
                                : "Seleccionar reclutador..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Buscar reclutador..." />
                              <CommandList>
                                <CommandEmpty>No se encontró ningún reclutador.</CommandEmpty>
                                <CommandGroup>
                                  {usuarios?.map((usuario) => (
                                    <CommandItem
                                      key={usuario.id}
                                      value={usuario.nombre}
                                      onSelect={() => {
                                        setSelectedRecruiterId(usuario.id);
                                        setOpenRecruiters(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedRecruiterId === usuario.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {usuario.nombre}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <input type="hidden" name="reclutador_id" value={selectedRecruiterId} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* El campo ejecutivo_id se oculta temporalmente por solicitud del usuario */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sueldo-prestaciones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sueldo y Prestaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salario_mensual_bruto">Salario mensual bruto</Label>
                      <Input
                        id="salario_mensual_bruto"
                        name="salario_mensual_bruto"
                        type="number"
                        placeholder="$"
                        value={salarioMensualBruto}
                        onChange={(e) => setSalarioMensualBruto(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="moneda_salario">Divisa del salario mensual bruto</Label>
                       <Select name="moneda_salario" value={monedaSalario} onValueChange={setMonedaSalario}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar divisa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MXN">Pesos Mexicanos (MXN)</SelectItem>
                          <SelectItem value="USD">Dólares Estadounidenses (USD)</SelectItem>
                          <SelectItem value="EUR">Euros (EUR)</SelectItem>
                          <SelectItem value="CAD">Dólares Canadienses (CAD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="periodo_pago">Periodo de pago</Label>
                     <Select name="periodo_pago" value={periodoPago} onValueChange={setPeriodoPago}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar un periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quincenal">Quincenal</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prestaciones">Prestaciones</Label>
                    <Input
                      id="prestaciones"
                      name="prestaciones"
                      placeholder="Ej. Prestaciones de ley, seguro médico, etc."
                      value={prestaciones}
                      onChange={(e) => setPrestaciones(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción de prestaciones</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={descripcionPrestaciones} onChange={setDescripcionPrestaciones} placeholder="Describe detalladamente las prestaciones ofrecidas..." />
                    </div>
                  </div>

                   <div className="space-y-2">
                    <Label>Beneficios adicionales</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={beneficiosAdicionales} onChange={setBeneficiosAdicionales} placeholder="Describe los beneficios adicionales como transporte, comedor, etc..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bonos</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={bonos} onChange={setBonos} placeholder="Describe los bonos ofrecidos como bonos de productividad, comisiones, etc..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Herramientas de trabajo</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={herramientasTrabajo} onChange={setHerramientasTrabajo} placeholder="Describe las herramientas y equipos proporcionados como computadora, uniformes, etc..." />
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="educacion-competencias" className="space-y-6">
               <Card>
                <CardHeader>
                  <CardTitle>Detalles del Perfil Requerido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría de la vacante</Label>
                      <Input
                        id="categoria"
                        name="categoria"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subcategoria">Subcategoría de la vacante</Label>
                      <Input
                        id="subcategoria"
                        name="subcategoria"
                        value={subcategoria}
                        onChange={(e) => setSubcategoria(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="nivel_educativo_min">Nivel de educación más alto</Label>
                       <Select name="nivel_educativo_min" value={nivelEducativoMin} onValueChange={setNivelEducativoMin}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primaria">Primaria</SelectItem>
                          <SelectItem value="secundaria">Secundaria</SelectItem>
                          <SelectItem value="preparatoria">Preparatoria / Bachillerato</SelectItem>
                          <SelectItem value="tecnico">Técnico Superior</SelectItem>
                          <SelectItem value="licenciatura">Licenciatura / Ingeniería</SelectItem>
                          <SelectItem value="maestria">Maestría</SelectItem>
                          <SelectItem value="doctorado">Doctorado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estatus_carrera">Estatus de la carrera</Label>
                       <Select name="estatus_carrera" value={estatusCarrera} onValueChange={setEstatusCarrera}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estatus" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="estudiante">Estudiante</SelectItem>
                          <SelectItem value="trunco">Trunco</SelectItem>
                          <SelectItem value="pasante">Pasante</SelectItem>
                          <SelectItem value="titulado">Titulado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="carrera">Carrera</Label>
                      <Input
                        id="carrera"
                        name="carrera"
                        placeholder="Ej: Administración, Sistemas, Contabilidad"
                        value={carrera}
                        onChange={(e) => setCarrera(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="anios_experiencia_min">Años de experiencia</Label>
                      <Input
                        id="anios_experiencia_min"
                        name="anios_experiencia_min"
                        type="number"
                        min="0"
                        placeholder="Ej: 2"
                        value={aniosExperienciaMin}
                        onChange={(e) => setAniosExperienciaMin(e.target.value)}
                      />
                    </div>
                  </div>

                   <div className="space-y-2">
                    <Label>Competencias requeridas</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={competenciasClave} onChange={setCompetenciasClave} placeholder="Ej: Liderazgo, Trabajo en equipo, Comunicación" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label>Idiomas requeridos</Label>
                      <div className="bg-white">
                        <ReactQuill theme="snow" value={idiomasRequeridos} onChange={setIdiomasRequeridos} placeholder="Ej: Inglés Avanzado, Francés Básico" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Actividades de idiomas</Label>
                      <div className="bg-white">
                        <ReactQuill theme="snow" value={actividadesIdiomas} onChange={setActividadesIdiomas} placeholder="Descripción de actividades que requieren otro idioma" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Conocimientos requeridos</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={conocimientosTecnicos} onChange={setConocimientosTecnicos} placeholder="Especifica los conocimientos requeridos..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Experiencia requerida</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={experienciaRequerida} onChange={setExperienciaRequerida} placeholder="Detalle de la experiencia requerida..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Habilidades técnicas</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={habilidadesTecnicas} onChange={setHabilidadesTecnicas} placeholder="Software o herramientas específicas..." />
                    </div>
                  </div>

                </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="preguntas-knockout" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <KnockoutQuestionsTab 
                    questions={preguntasKnockout} 
                    onChange={setPreguntasKnockout} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

             {/* Actions Footer - Outside Tabs to be always visible */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="requiere_anticipo" 
                  name="requiere_anticipo" 
                  checked={requiereAnticipo}
                  onCheckedChange={setRequiereAnticipo}
                />
                <Label htmlFor="requiere_anticipo">Requiere Anticipo</Label>
              </div>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/vacantes')}
                >
                  Cancelar
                </Button>
                {!isEditing && (
                  <Button 
                    type="submit" 
                    variant="secondary" 
                    disabled={isLoading}
                    onClick={() => setShouldRegisterAnother(true)}
                  >
                    Guardar y registrar otra
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  onClick={() => setShouldRegisterAnother(false)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Guardar Vacante'}
                </Button>
              </div>
            </div>

          </Tabs>
        </form>
      </div>
    </DashboardLayout>
  );
}

