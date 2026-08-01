# UI Redesign — Proyect Control Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rediseñar la capa visual de toda la app con un sistema de diseño compacto, verde como color de marca, y el nombre "Proyect Control" en la navegación.

**Decisiones de diseño aprobadas:**
- Estilo: Compacto con color de marca (iconos en tarjetas, píldoras de nav, tipografía fuerte)
- Color primario: `#16a34a` (green-600 de Tailwind)
- Navegación: Barra superior con píldoras (pill-style active state)
- Nombre de marca: **Proyect Control** (logo badge "PC")

---

## Sistema de diseño

### Paleta de color

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#16a34a` | Nav activa, botones primarios, barras de progreso, acentos |
| `primary-light` | `#dcfce7` | Fondo de iconos verdes, badges "Activo" |
| `primary-dark` | `#15803d` | Texto en badges verdes |
| `amber` | `#f59e0b` / `#fef3c7` | Facturas recibidas, alertas |
| `blue` | `#3b82f6` / `#dbeafe` | Facturas parciales |
| `red` | `#dc2626` / `#fee2e2` | Riesgo presupuestal |
| `gray-text` | `#9ca3af` | Labels, fechas, texto secundario |
| `bg` | `#f1f5f9` | Fondo de la app |
| `surface` | `#ffffff` | Cards, tablas, navbar |
| `border` | `#e2e8f0` | Bordes de cards y tablas |

### Tipografía

- Fuente: sistema (`-apple-system, BlinkMacSystemFont, 'Segoe UI'`) — sin cambios
- Títulos de página: `text-2xl font-extrabold tracking-tight text-gray-900`
- Labels de KPI: `text-[10px] font-bold uppercase tracking-widest text-gray-400`
- Valores de KPI: `text-3xl font-extrabold text-gray-900`
- Encabezados de tabla: `text-[10px] font-bold uppercase tracking-wide text-gray-400`
- Filas de tabla: `text-sm text-gray-600`, nombre en `font-semibold text-gray-900`

### Sombras y bordes

- Cards: `border border-gray-200 rounded-xl shadow-sm`
- Navbar: `border-b border-gray-200 shadow-sm`
- Sin sombras pesadas — solo `shadow-sm`

---

## Componentes

### 1. Navbar (`layout.tsx`)

**Antes:** Logo texto plano "OpsCore", links con subrayado activo azul.

**Después:**
- Badge verde `PC` + texto "Proyect Control"
- Links de nav como píldoras: activo = `bg-green-600 text-white rounded-full px-4 py-1.5 font-semibold`, inactivo = `text-gray-500 hover:bg-gray-100 rounded-full px-4 py-1.5`
- Altura fija `h-[54px]`, `shadow-sm`

```tsx
// Badge de marca
<span className="bg-green-600 text-white text-[11px] font-black px-2 py-1 rounded-md tracking-wide">
  PC
</span>
<span className="font-bold text-[14px] text-gray-900 tracking-tight">Proyect Control</span>
```

### 2. NavLink (`NavLink.tsx`)

**Después:** Pill-style con verde activo:

```tsx
isActive
  ? 'bg-green-600 text-white font-semibold px-4 py-1.5 rounded-full text-sm'
  : 'text-gray-500 hover:bg-gray-100 px-4 py-1.5 rounded-full text-sm transition-colors'
```

### 3. KPI Cards (dashboard `page.tsx`)

Cada card tiene:
- `rounded-xl border border-gray-200 bg-white shadow-sm p-5`
- Header: label (uppercase tiny) + icono en badge de color (`w-8 h-8 rounded-lg flex items-center justify-center`)
- Valor: `text-3xl font-extrabold`
- Barra de progreso verde (solo en card de presupuesto)
- Sub-texto en gris
- Link "Ver →" en verde

Iconos por card:
- Proyectos activos: 🏗️ sobre `bg-green-100`
- Presupuesto: 💰 sobre `bg-green-100`
- Facturas: 📄 sobre `bg-amber-100`

### 4. Tablas (`ProyectosTabla.tsx`, `FacturasTabla.tsx`, tablas de catálogos)

**Wrapper:** `rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden`

**Toolbar (encima de la tabla):**
```tsx
<div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
  <span className="text-sm font-bold text-gray-900">{título}</span>
  <button className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md">
    + Nuevo
  </button>
</div>
```

**Encabezados:** `bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-400 px-5 py-2.5`

**Filas:** `hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0`

**Celdas:** `px-5 py-3 text-sm`

### 5. Badges de estado

Reemplazar clases actuales por sistema consistente de píldoras:

| Estado | Clases |
|--------|--------|
| `activo` | `bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full` |
| `cerrado` | `bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full` |
| `recibida` | `bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full` |
| `parcialmente_asignada` | `bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full` |
| `asignada` | `bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full` |
| `cerrada` (factura) | `bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full` |

Extraer a helper `src/lib/badge.ts`:
```ts
export function estadoBadge(estado: string): string { ... }
```

### 6. Barra de riesgo presupuestal (`ProyectosTabla.tsx`)

Reemplazar el porcentaje de texto plano por barra visual + número:

```tsx
<div className="flex items-center gap-2">
  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
  </div>
  <span className={`text-xs font-semibold ${textColor}`}>{pct}%</span>
</div>
```

Colores: `<70%` → verde, `70-85%` → ámbar, `>85%` → rojo.

### 7. Botones primarios

Reemplazar `bg-blue-600` por `bg-green-600 hover:bg-green-700` en todos los botones de acción principal (Guardar, Nuevo, Subir XML, etc.).

### 8. Fondo de la app

`bg-gray-50` → `bg-slate-100` (un tono más cálido, `#f1f5f9`). Cambiar en `layout.tsx`.

---

## Alcance de archivos

| Archivo | Cambios |
|---------|---------|
| `src/app/(dashboard)/layout.tsx` | Navbar completo, fondo `bg-slate-100` |
| `src/app/(dashboard)/components/NavLink.tsx` | Pill-style activo verde |
| `src/app/(dashboard)/components/CatalogosDropdown.tsx` | Pill-style consistente con NavLink |
| `src/app/(dashboard)/page.tsx` | KPI cards rediseñadas con iconos |
| `src/app/(dashboard)/proyectos/components/ProyectosTabla.tsx` | Wrapper, toolbar, barra de riesgo |
| `src/app/(dashboard)/facturas/components/FacturasTabla.tsx` | Wrapper, toolbar, badges |
| `src/app/(dashboard)/catalogos/proveedores/components/ProveedoresTabla.tsx` | Wrapper, toolbar |
| `src/app/(dashboard)/catalogos/materiales/components/MaterialesTabla.tsx` | Wrapper, toolbar |
| `src/lib/badge.ts` | **Nuevo:** helper `estadoBadge()` |
| Todos los formularios (`ProyectoForm`, `ProyectoEditForm`, etc.) | Botones primarios → verde |

---

## Lo que NO cambia

- Estructura de rutas y navegación (mismas URLs)
- Lógica de negocio, queries, API routes
- Funcionalidad de dropdowns, formularios, toasts
- Layout responsive (mobile nav ya existente se mantiene)
- Componentes internos de proyecto (`FrenteSection`, `ReporteEditor`, etc.) — solo ajuste de botones

---

## Criterio de éxito

- Navbar muestra "PC · Proyect Control" con píldoras verdes
- Dashboard tiene 3 KPI cards con iconos en badges de color
- Todas las tablas tienen toolbar con botón verde y filas con hover
- Badges de estado son consistentes en toda la app (usando `estadoBadge()`)
- No hay regresiones funcionales — todas las acciones CRUD siguen funcionando
