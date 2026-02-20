DO $$
DECLARE
    v_cliente_id UUID;
    v_reclutador_id UUID;
    v_etapa_postulado_id UUID;
BEGIN
    -- 1. Intentar encontrar o crear al cliente Hex
    SELECT id INTO v_cliente_id FROM public.clientes WHERE nombre ILIKE '%Hex%' LIMIT 1;
    
    IF v_cliente_id IS NULL THEN
        INSERT INTO public.clientes (nombre, industria, sector, activo)
        VALUES ('Hex Technology Solutions', 'Tecnología', 'Consultoría y Servicios de IT', true)
        RETURNING id INTO v_cliente_id;
    END IF;

    -- 2. Obtener un reclutador (el primero disponible) para asignar las vacantes
    SELECT id INTO v_reclutador_id FROM public.user_roles WHERE role = 'reclutador' LIMIT 1;
    
    -- Si no hay reclutador, intentar admin
    IF v_reclutador_id IS NULL THEN
        SELECT id INTO v_reclutador_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
    END IF;

    -- 3. Insertar Vacantes
    
    -- 1. Chofer de Reparto
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Chofer de Reparto Local',
        '<p>Buscamos chofer responsable para entrega de mercancía en zona metropolitana.</p><ul><li>Licencia vigente tipo B.</li><li>Conocimiento de la ciudad.</li><li>Experiencia en manejo de unidades de 3.5 toneladas.</li></ul>',
        v_cliente_id, 'Ciudad de México', 'Logística', 'tiempo_completo', 'publicada', 'media',
        8000, 12000, v_reclutador_id, 'Operativo', 'Logística', '2 años en puestos similares'
    );

    -- 2. Director de Operaciones
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Director de Operaciones (COO)',
        '<p>Liderar la estrategia operativa de la compañía, optimizando procesos y garantizando la eficiencia en la cadena de suministro.</p>',
        v_cliente_id, 'Monterrey, NL', 'Operaciones', 'tiempo_completo', 'publicada', 'urgente',
        80000, 120000, v_reclutador_id, 'Directivo', 'Gerencia Senior', '10 años en puestos directivos'
    );

    -- 3. Analista de RRHH
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Analista de Atracción de Talento',
        '<p>Gestión de procesos de reclutamiento de principio a fin, manejo de fuentes de reclutamiento y entrevistas por competencias.</p>',
        v_cliente_id, 'Guadalajara, Jal', 'RRHH', 'tiempo_completo', 'publicada', 'media',
        15000, 20000, v_reclutador_id, 'Administrativo', 'Recursos Humanos', '3 años en reclutamiento'
    );

    -- 4. Gerente de Ventas
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Gerente de Ventas Regional',
        '<p>Desarrollo de cartera de clientes, cumplimiento de metas comerciales y liderazgo de equipo de ventas.</p>',
        v_cliente_id, 'Querétaro, Qro', 'Ventas', 'tiempo_completo', 'publicada', 'alta',
        30000, 45000, v_reclutador_id, 'Gerencial', 'Comercial', '5 años en ventas B2B'
    );

    -- 5. Auxiliar de Almacén
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Auxiliar de Almacén e Inventarios',
        '<p>Carga y descarga, acomodo de mercancía, control de entradas y salidas.</p>',
        v_cliente_id, 'Puebla, Pue', 'Almacén', 'tiempo_completo', 'publicada', 'baja',
        7000, 9000, v_reclutador_id, 'Operativo', 'Almacén', '6 meses de experiencia'
    );

    -- 6. Desarrollador Full Stack
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida, conocimientos_tecnicos
    ) VALUES (
        'Senior Full Stack Developer (React/Node)',
        '<p>Desarrollo de nuevas funcionalidades, mantenimiento de microservicios y optimización de base de datos.</p>',
        v_cliente_id, 'Remoto', 'IT', 'tiempo_completo', 'publicada', 'alta',
        50000, 75000, v_reclutador_id, 'Profesional', 'Tecnología', '5 años en desarrollo web', 'React, Node.js, PostgreSQL, AWS'
    );

    -- 7. Jefe de Mantenimiento
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Jefe de Mantenimiento Industrial',
        '<p>Planificación de mantenimiento preventivo y correctivo de maquinaria de producción.</p>',
        v_cliente_id, 'Toluca, Edo Mex', 'Mantenimiento', 'tiempo_completo', 'publicada', 'media',
        25000, 35000, v_reclutador_id, 'Técnico', 'Infraestructura', '4 años en industria'
    );

    -- 8. Asistente de Dirección
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Asistente Ejecutivo de Dirección',
        '<p>Gestión de agenda, organización de viajes, atención a visitas y apoyo administrativo general.</p>',
        v_cliente_id, 'Ciudad de México', 'Administración', 'tiempo_completo', 'publicada', 'media',
        18000, 25000, v_reclutador_id, 'Administrativo', 'Soporte', '3 años en puestos similares'
    );

    -- 9. Contador Senior
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Contador Senior Fiscalista',
        '<p>Contabilidad general, declaraciones fiscales, auditorías internas y estados financieros.</p>',
        v_cliente_id, 'León, Gto', 'Finanzas', 'tiempo_completo', 'publicada', 'media',
        35000, 45000, v_reclutador_id, 'Profesional', 'Contabilidad', '6 años de experiencia'
    );

    -- 10. CEO (Director General)
    INSERT INTO public.vacantes (
        titulo, descripcion, cliente_id, ubicacion, area, tipo_contrato, estado, prioridad, 
        salario_min, salario_max, reclutador_id, categoria, subcategoria, experiencia_requerida
    ) VALUES (
        'Director General (CEO)',
        '<p>Definir la visión y dirección estratégica de la organización para asegurar su crecimiento y sostenibilidad.</p>',
        v_cliente_id, 'Ciudad de México', 'Dirección', 'tiempo_completo', 'publicada', 'urgente',
        150000, 250000, v_reclutador_id, 'Directivo', 'Alta Dirección', '15 años de liderazgo comprobado'
    );

END $$;
