-- ============================================================
-- PRODGERS MVP — Migración 001: Esquema inicial
-- Fecha: 2026-06-13
-- Base de datos: prodgers_db
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLA: instaladoras
-- ============================================================
CREATE TABLE IF NOT EXISTS instaladoras (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      TEXT        NOT NULL,
    cif         TEXT        NOT NULL UNIQUE,
    contacto    TEXT,
    telefono    TEXT,
    email       TEXT,
    estado      TEXT        NOT NULL DEFAULT 'Activa'
                            CHECK (estado IN ('Activa', 'Inactiva')),
    saldo_base  NUMERIC(10,2) NOT NULL DEFAULT 0
                            CHECK (saldo_base >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLA: usuarios
--
-- Roles:
--   instaladora_propietario  → usuario de instaladora, puede invitar otros usuarios
--   instaladora_gestor       → usuario de instaladora, solo gestiona expedientes
--   operativo                → usuario interno PRODGERS
--   admin                    → usuario interno PRODGERS con acceso total
--
-- Constraint: rol instaladora → instaladora_id requerido
--             rol prodgers    → instaladora_id debe ser NULL
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    instaladora_id          UUID        REFERENCES instaladoras(id),
    nombre                  TEXT        NOT NULL,
    identificador_legal     TEXT        NOT NULL UNIQUE,
    email                   TEXT,
    telefono                TEXT,
    password_hash           TEXT        NOT NULL,
    rol                     TEXT        NOT NULL
                                        CHECK (rol IN (
                                            'instaladora_propietario',
                                            'instaladora_gestor',
                                            'operativo',
                                            'admin'
                                        )),
    estado                  TEXT        NOT NULL DEFAULT 'Activo'
                                        CHECK (estado IN ('Activo', 'Inactivo')),
    debe_cambiar_password   BOOLEAN     NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID        REFERENCES usuarios(id)
);

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_rol_instaladora_id;
ALTER TABLE usuarios ADD CONSTRAINT chk_rol_instaladora_id CHECK (
    (rol IN ('instaladora_propietario', 'instaladora_gestor') AND instaladora_id IS NOT NULL)
    OR
    (rol IN ('operativo', 'admin') AND instaladora_id IS NULL)
);


-- ============================================================
-- TABLA: clientes_finales
-- Un cliente pertenece a una instaladora.
-- El mismo DNI/NIE puede existir en distintas instaladoras (clientes distintos).
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes_finales (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    instaladora_id  UUID        NOT NULL REFERENCES instaladoras(id),
    nombre          TEXT        NOT NULL,
    dni_nie         TEXT        NOT NULL,
    telefono        TEXT,
    correo          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (instaladora_id, dni_nie)
);


-- ============================================================
-- SECUENCIA DIARIA PARA CÓDIGO DE EXPEDIENTE
-- Formato: EXP-YYMMDD-NNN (ej. EXP-260613-001)
-- El contador reinicia cada día.
-- La función es segura bajo concurrencia (ON CONFLICT DO UPDATE es atómica).
-- ============================================================
CREATE TABLE IF NOT EXISTS seq_expediente_diario (
    fecha           DATE    PRIMARY KEY,
    ultimo_numero   INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION generar_codigo_expediente()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_fecha     DATE    := CURRENT_DATE;
    v_numero    INTEGER;
    v_codigo    TEXT;
BEGIN
    INSERT INTO seq_expediente_diario (fecha, ultimo_numero)
    VALUES (v_fecha, 1)
    ON CONFLICT (fecha) DO UPDATE
        SET ultimo_numero = seq_expediente_diario.ultimo_numero + 1
    RETURNING ultimo_numero INTO v_numero;

    v_codigo := 'EXP-' || TO_CHAR(v_fecha, 'YYMMDD') || '-' || LPAD(v_numero::TEXT, 3, '0');
    RETURN v_codigo;
END;
$$;


-- ============================================================
-- TABLA: expedientes
-- Incluye datos de instalación y datos técnicos en la misma tabla
-- (relación 1:1 estricta, sin beneficio de tabla separada en MVP).
-- ============================================================
CREATE TABLE IF NOT EXISTS expedientes (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo                  TEXT        NOT NULL UNIQUE DEFAULT generar_codigo_expediente(),
    instaladora_id          UUID        NOT NULL REFERENCES instaladoras(id),
    cliente_final_id        UUID        NOT NULL REFERENCES clientes_finales(id),
    responsable_id          UUID        REFERENCES usuarios(id),

    -- Estado y tipo de servicio
    estado                  TEXT        NOT NULL DEFAULT 'Recibido'
                                        CHECK (estado IN (
                                            'Recibido',
                                            'Revision documental',
                                            'Documentacion pendiente',
                                            'Documentacion validada',
                                            'MTD en elaboracion',
                                            'MTD finalizada',
                                            'Declaracion Responsable presentada',
                                            'Justificante Ayuntamiento recibido',
                                            'Instalacion en ejecucion',
                                            'Pendiente CIE',
                                            'CAU solicitado',
                                            'CAU obtenido',
                                            'Registro Industria obtenido',
                                            'Comunicacion distribuidora realizada',
                                            'Validacion distribuidora pendiente',
                                            'Compensacion activada',
                                            'Finalizado',
                                            'Subsanacion',
                                            'Cancelado'
                                        )),
    servicio                TEXT        NOT NULL
                                        CHECK (servicio IN (
                                            'Pack completo',
                                            'MTD',
                                            'Legalizacion',
                                            'Declaracion Responsable'
                                        )),

    -- Datos de instalación
    direccion               TEXT        NOT NULL,
    municipio               TEXT        NOT NULL,
    provincia               TEXT        NOT NULL,
    codigo_postal           TEXT,
    distribuidora           TEXT        NOT NULL,
    cups                    TEXT,
    potencia_kw             NUMERIC(6,3) NOT NULL
                                        CHECK (potencia_kw > 0 AND potencia_kw < 10),

    -- Datos técnicos
    marca_panel             TEXT        NOT NULL,
    modelo_panel            TEXT        NOT NULL,
    cantidad_paneles        INTEGER     NOT NULL CHECK (cantidad_paneles > 0),
    marca_inversor          TEXT        NOT NULL,
    modelo_inversor         TEXT        NOT NULL,
    potencia_inversor_kwp   NUMERIC(6,3) NOT NULL CHECK (potencia_inversor_kwp > 0),
    modalidad_autoconsumo   TEXT        NOT NULL
                                        CHECK (modalidad_autoconsumo IN (
                                            'Sin excedentes',
                                            'Con excedentes acogido a compensacion',
                                            'Con excedentes no acogido a compensacion'
                                        )),

    -- Observaciones libres
    observaciones           TEXT,

    -- Metadatos
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID        NOT NULL REFERENCES usuarios(id),
    updated_by              UUID        REFERENCES usuarios(id)
);


-- ============================================================
-- TABLA: documentos_entrada
-- Documentos subidos por la instaladora.
-- Cada versión es una fila nueva; la anterior queda como 'reemplazado'.
-- storage_path: ruta relativa en /var/lib/prodgers/uploads/
-- ============================================================
CREATE TABLE IF NOT EXISTS documentos_entrada (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id           UUID        NOT NULL REFERENCES expedientes(id),
    tipo_documento          TEXT        NOT NULL
                                        CHECK (tipo_documento IN (
                                            'dni_nie_titular',
                                            'factura_electrica',
                                            'autorizacion_firmada',
                                            'fotografias_cubierta',
                                            'fotografias_contador',
                                            'fotografias_cuadro_electrico',
                                            'documentacion_tecnica'
                                        )),
    estado                  TEXT        NOT NULL DEFAULT 'Pendiente'
                                        CHECK (estado IN ('Pendiente', 'Subido', 'Validado', 'Incorrecto')),
    version                 INTEGER     NOT NULL DEFAULT 1,
    storage_path            TEXT,
    nombre_archivo          TEXT,
    mime_type               TEXT
                                        CHECK (mime_type IN (
                                            'application/pdf',
                                            'image/jpeg',
                                            'image/png',
                                            'image/webp'
                                        )),
    tamano_bytes            INTEGER     CHECK (tamano_bytes > 0),
    reemplaza_documento_id  UUID        REFERENCES documentos_entrada(id),
    subido_por              UUID        REFERENCES usuarios(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLA: documentos_finales
-- Documentos entregados por PRODGERS a la instaladora.
-- ============================================================
CREATE TABLE IF NOT EXISTS documentos_finales (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id   UUID        NOT NULL REFERENCES expedientes(id),
    fase            TEXT        NOT NULL
                                CHECK (fase IN (
                                    'MTD',
                                    'Declaracion Responsable',
                                    'CAU',
                                    'Legalizacion',
                                    'Justificante Ayuntamiento',
                                    'Registro Industria',
                                    'Carpeta final'
                                )),
    titulo          TEXT        NOT NULL,
    estado          TEXT        NOT NULL DEFAULT 'Pendiente'
                                CHECK (estado IN ('Pendiente', 'Disponible')),
    storage_path    TEXT,
    nombre_archivo  TEXT,
    mime_type       TEXT,
    subido_por      UUID        REFERENCES usuarios(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLA: historial_expediente
-- Registro cronológico de cambios de estado y eventos del expediente.
-- ============================================================
CREATE TABLE IF NOT EXISTS historial_expediente (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id       UUID        NOT NULL REFERENCES expedientes(id),
    titulo              TEXT        NOT NULL,
    descripcion         TEXT,
    estado_anterior     TEXT,
    estado_nuevo        TEXT,
    actor_usuario_id    UUID        REFERENCES usuarios(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLA: correcciones
-- Solicitudes de corrección de documentos o campos, emitidas por PRODGERS.
-- ============================================================
CREATE TABLE IF NOT EXISTS correcciones (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id       UUID        NOT NULL REFERENCES expedientes(id),
    campo_afectado      TEXT        NOT NULL,
    nota                TEXT        NOT NULL,
    estado              TEXT        NOT NULL DEFAULT 'Pendiente'
                                    CHECK (estado IN ('Pendiente', 'Resuelta')),
    solicitado_por      UUID        NOT NULL REFERENCES usuarios(id),
    resuelto_por        UUID        REFERENCES usuarios(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLA: tasas
-- Pagos de tasas registrados por PRODGERS y descontados del saldo de la instaladora.
-- El saldo restante se calcula: instaladoras.saldo_base - SUM(tasas.monto) por instaladora.
-- ============================================================
CREATE TABLE IF NOT EXISTS tasas (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id       UUID            NOT NULL REFERENCES expedientes(id),
    instaladora_id      UUID            NOT NULL REFERENCES instaladoras(id),
    concepto            TEXT            NOT NULL,
    monto               NUMERIC(10,2)   NOT NULL CHECK (monto > 0),
    comprobante_path    TEXT,
    registrado_por      UUID            NOT NULL REFERENCES usuarios(id),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLA: auditoria
-- Registro de acciones sensibles: logins, cambios de estado, modificaciones de usuario, etc.
-- datos_anterior y datos_nuevo almacenan snapshot JSON de los campos afectados.
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_usuario_id    UUID        REFERENCES usuarios(id),
    accion              TEXT        NOT NULL,
    entidad_tipo        TEXT        NOT NULL,
    entidad_id          UUID,
    datos_anterior      JSONB,
    datos_nuevo         JSONB,
    ip_address          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TRIGGER: updated_at automático en tablas con esa columna
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_instaladoras_updated_at ON instaladoras;
CREATE TRIGGER trg_instaladoras_updated_at
    BEFORE UPDATE ON instaladoras
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_clientes_finales_updated_at ON clientes_finales;
CREATE TRIGGER trg_clientes_finales_updated_at
    BEFORE UPDATE ON clientes_finales
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_expedientes_updated_at ON expedientes;
CREATE TRIGGER trg_expedientes_updated_at
    BEFORE UPDATE ON expedientes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_correcciones_updated_at ON correcciones;
CREATE TRIGGER trg_correcciones_updated_at
    BEFORE UPDATE ON correcciones
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- ÍNDICES
-- ============================================================

-- usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_rol           ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado        ON usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_instaladora   ON usuarios(instaladora_id);

-- instaladoras
CREATE INDEX IF NOT EXISTS idx_instaladoras_estado    ON instaladoras(estado);

-- clientes_finales
CREATE INDEX IF NOT EXISTS idx_clientes_instaladora   ON clientes_finales(instaladora_id);

-- expedientes
CREATE INDEX IF NOT EXISTS idx_exp_instaladora        ON expedientes(instaladora_id);
CREATE INDEX IF NOT EXISTS idx_exp_estado             ON expedientes(estado);
CREATE INDEX IF NOT EXISTS idx_exp_responsable        ON expedientes(responsable_id);
CREATE INDEX IF NOT EXISTS idx_exp_servicio           ON expedientes(servicio);
CREATE INDEX IF NOT EXISTS idx_exp_cliente            ON expedientes(cliente_final_id);

-- documentos_entrada
CREATE INDEX IF NOT EXISTS idx_docs_entrada_exp       ON documentos_entrada(expediente_id, tipo_documento);

-- documentos_finales
CREATE INDEX IF NOT EXISTS idx_docs_finales_exp       ON documentos_finales(expediente_id);

-- historial
CREATE INDEX IF NOT EXISTS idx_historial_exp          ON historial_expediente(expediente_id, created_at DESC);

-- correcciones
CREATE INDEX IF NOT EXISTS idx_correcciones_exp       ON correcciones(expediente_id, estado);

-- tasas
CREATE INDEX IF NOT EXISTS idx_tasas_exp              ON tasas(expediente_id);
CREATE INDEX IF NOT EXISTS idx_tasas_instaladora      ON tasas(instaladora_id);

-- auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_actor        ON auditoria(actor_usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad      ON auditoria(entidad_tipo, entidad_id);


-- ============================================================
-- PERMISOS: usuario de aplicación (prodgers_app)
-- Solo DML. Sin DDL. El usuario migrador se gestiona fuera de esta migración.
-- ============================================================
GRANT CONNECT ON DATABASE prodgers_db TO prodgers_app;
GRANT USAGE ON SCHEMA public TO prodgers_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO prodgers_app;
GRANT EXECUTE ON FUNCTION generar_codigo_expediente() TO prodgers_app;
