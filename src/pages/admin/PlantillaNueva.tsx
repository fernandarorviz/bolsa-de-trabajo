
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import KnockoutQuestionsTab from '@/components/vacancies/KnockoutQuestionsTab';
import type { TipoContrato, PrioridadVacante, KnockoutQuestion, ClasificacionVacante, VacancyTemplate } from '@/types/ats';

export default function PlantillaNueva() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams();
  const isEditing = !!id;

  // Template specific state
  const [nombrePlantilla, setNombrePlantilla] = useState('');

  // Vacancy fields state
  const [titulo, setTitulo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [area, setArea] = useState('');
  const [posiciones, setPosiciones] = useState(1);
  const [tipoContrato, setTipoContrato] = useState<TipoContrato | "">("tiempo_completo");
  const [prioridad, setPrioridad] = useState<PrioridadVacante | "">("media");
  const [clasificacion, setClasificacion] = useState<ClasificacionVacante | "">("administrativa");
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
  const [rangoEdad, setRangoEdad] = useState<number[]>([18, 55]);
  const [disponibilidadViaje, setDisponibilidadViaje] = useState(false);
  
  // Education/Skills
  const [competenciasClave, setCompetenciasClave] = useState('');
  const [idiomasRequeridos, setIdiomasRequeridos] = useState('');
  const [actividadesIdiomas, setActividadesIdiomas] = useState('');
  const [conocimientosTecnicos, setConocimientosTecnicos] = useState('');
  const [experienciaRequerida, setExperienciaRequerida] = useState('');
  const [habilidadesTecnicas, setHabilidadesTecnicas] = useState('');
  const [preguntasKnockout, setPreguntasKnockout] = useState<KnockoutQuestion[]>([]);

  // Client selection (Optional for templates)
  const [openClientes, setOpenClientes] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const { data: plantilla, isLoading: isLoadingPlantilla } = useQuery({
    queryKey: ['plantilla', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('vacancy_templates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as VacancyTemplate;
    },
    enabled: isEditing,
  });

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

  useEffect(() => {
    if (plantilla) {
      setNombrePlantilla(plantilla.nombre_plantilla || '');
      setTitulo(plantilla.titulo || '');
      setDescripcion(plantilla.descripcion || '');
      setUbicacion(plantilla.ubicacion || '');
      setArea(plantilla.area || '');
      setTipoContrato(plantilla.tipo_contrato || "tiempo_completo");
      setPrioridad(plantilla.prioridad || "media");
      setClasificacion(plantilla.clasificacion || "administrativa");
      setSalarioMin(plantilla.salario_min?.toString() || '');
      setSalarioMax(plantilla.salario_max?.toString() || '');
      setRequiereAnticipo(plantilla.requiere_anticipo || false);
      setPosiciones(plantilla.posiciones || 1);
      
      if (plantilla.cliente_id) {
        setSelectedClientId(plantilla.cliente_id);
      }

      if (plantilla.rango_edad_min !== null && plantilla.rango_edad_max !== null) {
        setRangoEdad([plantilla.rango_edad_min as number, plantilla.rango_edad_max as number]);
      }
      
      setGenero(plantilla.genero || "indistinto");
      setDisponibilidadViaje(plantilla.disponibilidad_viaje || false);
      setCategoria(plantilla.categoria || '');
      setSubcategoria(plantilla.subcategoria || '');
      setNivelEducativoMin(plantilla.nivel_educativo_min || 'licenciatura');
      setCarrera(plantilla.carrera || '');
      setEstatusCarrera(plantilla.estatus_carrera || 'titulado');
      setAniosExperienciaMin(plantilla.anios_experiencia_min?.toString() || '');
      setIdiomasRequeridos(plantilla.idiomas_requeridos || '');
      setActividadesIdiomas(plantilla.actividades_idiomas || '');
      setConocimientosTecnicos(plantilla.conocimientos_tecnicos || '');
      setExperienciaRequerida(plantilla.experiencia_requerida || '');
      setHabilidadesTecnicas(plantilla.habilidades_tecnicas || '');
      setCompetenciasClave(plantilla.competencias_clave || '');
      setSalarioMensualBruto(plantilla.salario_mensual_bruto?.toString() || '');
      setMonedaSalario(plantilla.moneda_salario || "MXN");
      setPeriodoPago(plantilla.periodo_pago || "mensual");
      setPrestaciones(plantilla.prestaciones || '');
      setDescripcionPrestaciones(plantilla.descripcion_prestaciones || '');
      setBeneficiosAdicionales(plantilla.beneficios_adicionales || '');
      setBonos(plantilla.bonos || '');
      setHerramientasTrabajo(plantilla.herramientas_trabajo || '');
      
      if (plantilla.preguntas_knockout) {
        setPreguntasKnockout(plantilla.preguntas_knockout);
      }
    }
  }, [plantilla]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombrePlantilla.trim()) {
      toast.error('El nombre de la plantilla es obligatorio');
      return;
    }

    setIsLoading(true);

    const data = {
      nombre_plantilla: nombrePlantilla,
      titulo: titulo || null,
      descripcion: descripcion || null,
      ubicacion: ubicacion || null,
      area: area || null,
      tipo_contrato: tipoContrato || null,
      prioridad: prioridad || null,
      clasificacion: clasificacion || null,
      salario_min: salarioMin ? Number(salarioMin) : null,
      salario_max: salarioMax ? Number(salarioMax) : null,
      requiere_anticipo: requiereAnticipo,
      posiciones: posiciones,
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
      reclutador_id: user?.id, 
      cliente_id: selectedClientId || null,
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('vacancy_templates')
          .update(data)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vacancy_templates')
          .insert(data);
        if (error) throw error;
      }

      toast.success(isEditing ? 'Plantilla actualizada' : 'Plantilla creada');
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      navigate('/plantillas');
    } catch (error) {
      toast.error('Error al guardar la plantilla', {
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing && isLoadingPlantilla) {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/plantillas')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing 
                ? 'Modifica la información de la plantilla' 
                : 'Crea una nueva plantilla para reutilizar en tus vacantes'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6 border-l-4 border-l-primary/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="nombre_plantilla" className="text-lg font-semibold">Nombre de la Plantilla *</Label>
                <Input
                  id="nombre_plantilla"
                  placeholder="Ej: Desarrollo Web Senior, Ventas Jr, etc."
                  value={nombrePlantilla}
                  onChange={(e) => setNombrePlantilla(e.target.value)}
                  required
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">Este nombre es para identificar la plantilla internamente.</p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="info-basica" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
              <TabsTrigger value="info-basica" className="py-2">Datos Básicos</TabsTrigger>
              <TabsTrigger value="sueldo-prestaciones" className="py-2">Sueldo y Beneficios</TabsTrigger>
              <TabsTrigger value="educacion-competencias" className="py-2">Habilidades y Perfil</TabsTrigger>
              <TabsTrigger value="preguntas-knockout" className="py-2">Preguntas Knockout</TabsTrigger>
            </TabsList>

            <TabsContent value="info-basica" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información General de la Vacante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título del puesto sugerido</Label>
                    <Input
                      id="titulo"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej: Desarrollador Full Stack"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <div className="bg-white">
                      <ReactQuill theme="snow" value={descripcion} onChange={setDescripcion} placeholder="Describe las responsabilidades..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cliente_id">Cliente Asociado (Opcional)</Label>
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ubicacion">Ubicación / Región</Label>
                      <Input
                        id="ubicacion"
                        value={ubicacion}
                        onChange={(e) => setUbicacion(e.target.value)}
                        placeholder="Ej: Ciudad de México, Remoto"
                      />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="area">Área</Label>
                         <Input
                           id="area"
                           value={area}
                           onChange={(e) => setArea(e.target.value)}
                         />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tipo_contrato">Tipo de Contrato</Label>
                        <Select value={tipoContrato} onValueChange={(val: any) => setTipoContrato(val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Label htmlFor="prioridad">Prioridad Sugerida</Label>
                        <Select value={prioridad} onValueChange={(val: any) => setPrioridad(val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Label htmlFor="clasificacion">Clasificación</Label>
                      <Select value={clasificacion} onValueChange={(val: any) => setClasificacion(val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operativa">Operativa</SelectItem>
                          <SelectItem value="administrativa">Administrativa</SelectItem>
                          <SelectItem value="gerencial">Gerencial</SelectItem>
                          <SelectItem value="directiva">Directiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                   {/* Rango de edad */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4">
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
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="genero">Género</Label>
                        <Select value={genero} onValueChange={setGenero}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="femenino">Femenino</SelectItem>
                            <SelectItem value="indistinto">Indistinto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch id="disponibilidad_viaje" checked={disponibilidadViaje} onCheckedChange={setDisponibilidadViaje} />
                        <Label htmlFor="disponibilidad_viaje">Disponibilidad para viajar</Label>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sueldo-prestaciones" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Sueldo y Prestaciones</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Salario min</Label>
                                <Input type="number" value={salarioMin} onChange={e => setSalarioMin(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Salario max</Label>
                                <Input type="number" value={salarioMax} onChange={e => setSalarioMax(e.target.value)} />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Prestaciones</Label>
                            <Input value={prestaciones} onChange={e => setPrestaciones(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción Prestaciones</Label>
                            <div className="bg-white"><ReactQuill theme="snow" value={descripcionPrestaciones} onChange={setDescripcionPrestaciones} /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Beneficios Adicionales</Label>
                             <div className="bg-white"><ReactQuill theme="snow" value={beneficiosAdicionales} onChange={setBeneficiosAdicionales} /></div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="educacion-competencias" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Nivel Educativo</Label>
                                <Select value={nivelEducativoMin} onValueChange={setNivelEducativoMin}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="primaria">Primaria</SelectItem>
                                        <SelectItem value="secundaria">Secundaria</SelectItem>
                                        <SelectItem value="preparatoria">Preparatoria</SelectItem>
                                        <SelectItem value="tecnico">Técnico</SelectItem>
                                        <SelectItem value="licenciatura">Licenciatura</SelectItem>
                                        <SelectItem value="maestria">Maestría</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-2">
                                <Label>Carrera</Label>
                                <Input value={carrera} onChange={e => setCarrera(e.target.value)} />
                             </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Conocimientos Técnicos</Label>
                            <div className="bg-white"><ReactQuill theme="snow" value={conocimientosTecnicos} onChange={setConocimientosTecnicos} /></div>
                        </div>
                        <div className="space-y-2">
                             <Label>Competencias Clave</Label>
                             <div className="bg-white"><ReactQuill theme="snow" value={competenciasClave} onChange={setCompetenciasClave} /></div>
                        </div>
                         <div className="space-y-2">
                             <Label>Idiomas</Label>
                             <div className="bg-white"><ReactQuill theme="snow" value={idiomasRequeridos} onChange={setIdiomasRequeridos} /></div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="preguntas-knockout" className="space-y-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <KnockoutQuestionsTab questions={preguntasKnockout} onChange={setPreguntasKnockout} />
                  </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/plantillas')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Guardar Plantilla
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
