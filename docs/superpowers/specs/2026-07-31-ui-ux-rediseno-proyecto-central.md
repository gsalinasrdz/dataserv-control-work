# OpsCore — Rediseño UI/UX: Proyecto como Entidad Central

**Fecha:** 2026-07-31
**Enfoque:** Opción B — Rediseño centrado en el proyecto
**Usuarios objetivo:** Residentes encargados de obra

---

## 1. Contexto y objetivos

OpsCore es un sistema de control de costos para obra. Los usuarios (residentes) necesitan:
- Ver rápidamente el estado presupuestal de sus proyectos
- Navegar desde el proyecto hacia todo lo relacionado (frentes, facturas, costos)
- Generar un reporte PDF de costos ejercidos para presentación

La mejora central: el **proyecto** pasa de ser una entrada en una lista a ser el hub desde donde se accede a toda la información relacionada.

---

## 2. Navegación global

### 2.1 Cambio en el nav principal

**Antes:** `Proyectos | Facturas | Proveedores | Materiales`

**Después:** `Dashboard | Proyectos | Facturas | Catálogos ▾`

- "Catálogos" agrupa Proveedores y Materiales en un dropdown
- Libera espacio en el nav y deja claro que son datos de soporte, no flujos principales

### 2.2 Sin cambios en rutas existentes

Las URLs actuales no cambian. Solo cambia el label y agrupación visual en la barra de navegación.

---

## 3. Dashboard — mejoras

### 3.1 Alerta de proyectos en riesgo

En la tarjeta "Proyectos activos", los proyectos donde `ejercido / presupuesto > 85%` aparecen con un indicador naranja. No requiere nueva sección — es un badge sobre el contador existente.

Ejemplo:
```
Proyectos activos
      5
  ⚠ 2 en riesgo presupuestal
```

### 3.2 Sin otros cambios en el dashboard

Las tres tarjetas KPI actuales (proyectos activos, presupuesto total, facturas por estado) se conservan. Solo se agrega el indicador de riesgo.

---

## 4. Detalle de proyecto — sub-navegación por tabs

El detalle del proyecto (`/proyectos/:id`) pasa de página plana a estructura con tres tabs:

```
[Proyecto: PROJ-001 — Torre Residencial]
  Tab: Trabajos | Facturas | Reporte
```

### 4.1 Header del proyecto (compartido entre tabs)

```
PROJ-001  Torre Residencial                    [Editar] [Importar CSV]
Estado: Activo   Inicio: 01/03/2025   Fin est.: 30/11/2025

Presupuesto    Ejercido      Disponible    % Avance
$4,250,000     $3,100,000    $1,150,000    72.9%
[████████████████░░░░░░░░] 72.9%
```

La barra de progreso global del proyecto aparece en el header (no existía antes, solo había barras por frente).

Colores de la barra global:
- Verde: < 75%
- Naranja: 75–99%
- Rojo: ≥ 100% (sobreejercido)

---

## 5. Tab "Trabajos" (mejora de lo existente)

### 5.1 Barras de progreso por frente — codificación de color

Las barras de cada `FrenteSection` adoptan el mismo esquema:
- Verde: < 75% ejercido
- Naranja: 75–99%
- Rojo: ≥ 100%

Actualmente solo existe el contraste rojo/azul para sobreejercido. Se agrega el naranja como zona de advertencia.

### 5.2 Botón "+ Trabajo" siempre visible

Actualmente el botón aparece en el header del frente. Se mantiene ahí pero visible siempre, no solo en hover.

### 5.3 Estado vacío mejorado

Cuando el proyecto no tiene frentes:

> "Sin frentes de trabajo. Puedes agregar uno manualmente aquí abajo, o importar todas las partidas desde un CSV."
> `[Importar CSV]`

Los botones de acción quedan dentro del estado vacío, no separados.

### 5.4 Sin cambios en formularios

El formulario inline de agregar/editar trabajos y el importador CSV funcionan correctamente y no se modifican.

---

## 6. Tab "Facturas" (nuevo dentro del proyecto)

### 6.1 Propósito

Mostrar solo las facturas que tienen al menos un concepto asignado a este proyecto. Es una vista de solo lectura — la carga y asignación de facturas sigue ocurriendo en `/facturas`.

### 6.2 Columnas de la tabla

| Columna | Fuente |
|---|---|
| UUID / Folio | `facturas.uuidFiscal`, `facturas.folio` |
| Emisor | `facturas.nombreEmisor` |
| Total factura | `facturas.total` |
| Asignado a este proyecto | `SUM(asignaciones.importe)` filtrado por `proyectoId` |
| Estado | `facturas.estado` |

"Asignado a este proyecto" puede ser menor que el total si la factura tiene conceptos en múltiples proyectos.

### 6.3 Interacción

Click en una fila → navega a `/facturas/:id` (detalle existente).

### 6.4 Estado vacío

> "Sin facturas asignadas a este proyecto. Carga facturas desde la sección Facturas →"
> Con link directo a `/facturas`.

---

## 7. Tab "Reporte" (nuevo — flujo PDF)

### 7.1 Fuente de datos

Los datos del reporte provienen de:
- `asignaciones` filtradas por `proyectoId`
- Joined con `factura_conceptos` para obtener `descripcion`, `claveProdServ`, `importe`
- `asignaciones.categoria` para la categoría de costo

### 7.2 Vista previa editable

Al entrar al tab, el sistema muestra todos los conceptos consolidados:

```
Reporte de costos — PROJ-001
Generado desde N facturas · M conceptos

[Agrupar por: Frente ▾]          [Exportar PDF]

FRENTE: ESTRUCTURA
  ClaveProdServ   Descripción                Categoría      Importe
  10191509        Concreto premezclado FC250  Materiales     $95,000.00  [editar]
  30101701        Varilla corrugada 3/8"      Materiales     $48,500.00  [editar]

FRENTE: ACABADOS
  ...

                              TOTAL PROYECTO   $312,750.00
```

### 7.3 Edición inline antes de exportar

Cada fila expone dos campos editables al hacer click en "editar":
- **Descripción** — texto libre
- **Importe** — numérico

`ClaveProdServ` no es editable (proviene del XML fiscal).

Los cambios son **efímeros** — solo afectan el PDF generado, no modifican la base de datos.

### 7.4 Agrupación

El selector "Agrupar por" tiene tres opciones:
- **Frente** (default) — agrupa por `frentes.nombre`
- **Categoría** — agrupa por `asignaciones.categoria`
- **Sin agrupar** — lista plana ordenada por `factura_conceptos.descripcion`

### 7.5 Estructura del PDF generado

```
[Encabezado]
OpsCore — Reporte de costos
Proyecto: PROJ-001 — Torre Residencial
Fecha: 31/07/2026

[Tabla de conceptos — agrupada]
FRENTE: ESTRUCTURA
  ClaveProdServ | Descripción | Categoría | Importe
  10191509      | Concreto... | Materiales| $95,000.00
  ...
  Subtotal Estructura: $175,500.00

FRENTE: ACABADOS
  ...
  Subtotal Acabados: $137,250.00

TOTAL PROYECTO: $312,750.00

[Pie]
Generado por OpsCore · 31/07/2026
```

### 7.6 Estado vacío

> "Este proyecto no tiene costos asignados aún. Asigna conceptos de facturas de compra en la sección Facturas →"

### 7.7 Generación del PDF

Click en "Exportar PDF" → descarga directa del archivo en el navegador. La generación ocurre en el servidor mediante un Route Handler (`GET /api/proyectos/:id/reporte.pdf`) usando `@react-pdf/renderer`, que permite definir el layout del PDF con componentes React y es compatible con Next.js App Router sin configuración adicional.

---

## 8. Páginas sin cambios

Las siguientes páginas se conservan sin modificaciones de fondo:
- `/facturas` — lista global y carga de XML
- `/facturas/:id` — detalle con asignación de conceptos
- `/catalogos/proveedores` — CRUD completo
- `/catalogos/materiales` — CRUD completo

---

## 9. Resumen de cambios por archivo

| Archivo | Tipo de cambio |
|---|---|
| `(dashboard)/layout.tsx` | Nav: agrupar Catálogos en dropdown |
| `(dashboard)/page.tsx` | Dashboard: badge de proyectos en riesgo |
| `(dashboard)/proyectos/[proyectoId]/page.tsx` | Agregar tabs, header con barra global |
| `(dashboard)/proyectos/[proyectoId]/components/FrenteSection.tsx` | Colores de barra por umbral |
| `(dashboard)/proyectos/[proyectoId]/facturas/page.tsx` | Nuevo tab — lista de facturas del proyecto |
| `(dashboard)/proyectos/[proyectoId]/reporte/page.tsx` | Nuevo tab — vista editable + exportar PDF |
| `lib/queries/facturas.ts` | Nueva query: facturas por proyectoId |
| `lib/queries/reporte.ts` | Nueva query: conceptos consolidados por proyectoId |

---

## 10. Fuera de alcance

- Generación de CFDI de egreso (timbrado)
- Módulo de estimaciones o avance de obra
- Roles y permisos adicionales
- Paginación en tablas (alcance futuro)
- Notificaciones push o por email
