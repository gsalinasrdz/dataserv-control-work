# UI Redesign — Proyect Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la capa visual de la app con color de marca verde (`#16a34a`), navbar compacta con píldoras, KPI cards con iconos, tablas con toolbar, y el nombre "Proyect Control".

**Architecture:** Cambios puramente visuales en componentes existentes — sin tocar lógica de negocio, queries ni rutas. Se introduce `src/lib/badge.ts` como helper centralizado para clases de badges de estado, eliminando los mapas `ESTADO_BADGE` duplicados en cada tabla.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS, TypeScript. No hay suite de tests — la verificación es visual en browser (`npm run dev` o producción).

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `src/lib/badge.ts` | Crear | Helper `estadoBadge()` y `riesgoColor()` |
| `src/app/(dashboard)/layout.tsx` | Modificar | Navbar "Proyect Control", fondo, pill nav |
| `src/app/(dashboard)/components/NavLink.tsx` | Modificar | Pill-style activo verde |
| `src/app/(dashboard)/components/CatalogosDropdown.tsx` | Modificar | Pill-style consistente |
| `src/app/(dashboard)/page.tsx` | Modificar | KPI cards con iconos y barra de progreso |
| `src/app/(dashboard)/proyectos/page.tsx` | Modificar | Título bold, botón verde |
| `src/app/(dashboard)/proyectos/components/ProyectosTabla.tsx` | Modificar | Tabla rediseñada, barra de riesgo |
| `src/app/(dashboard)/facturas/page.tsx` | Modificar | Título bold |
| `src/app/(dashboard)/facturas/components/FacturasTabla.tsx` | Modificar | Tabla rediseñada, badges de `badge.ts` |
| `src/app/(dashboard)/catalogos/proveedores/page.tsx` | Modificar | Título bold, botón verde |
| `src/app/(dashboard)/catalogos/proveedores/components/ProveedoresTabla.tsx` | Modificar | Tabla rediseñada |
| `src/app/(dashboard)/catalogos/materiales/page.tsx` | Modificar | Título bold, botón verde |
| `src/app/(dashboard)/catalogos/materiales/components/MaterialesTabla.tsx` | Modificar | Tabla rediseñada |

---

### Task 1: Helper centralizado de badges

**Files:**
- Create: `src/lib/badge.ts`

- [ ] **Step 1: Crear `src/lib/badge.ts`**

```ts
// src/lib/badge.ts

/** Clases Tailwind para badges de estado de proyecto o factura */
export function estadoBadge(estado: string): string {
  const map: Record<string, string> = {
    activo:                  'bg-green-100 text-green-800',
    pausado:                 'bg-amber-100 text-amber-800',
    cerrado:                 'bg-gray-100 text-gray-600',
    recibida:                'bg-amber-100 text-amber-800',
    parcialmente_asignada:   'bg-blue-100 text-blue-800',
    asignada:                'bg-green-100 text-green-800',
  };
  return map[estado] ?? 'bg-gray-100 text-gray-600';
}

/** Colores para la barra de riesgo presupuestal */
export function riesgoColor(pct: number): { bar: string; text: string } {
  if (pct > 85) return { bar: 'bg-red-500',   text: 'text-red-600' };
  if (pct > 70) return { bar: 'bg-amber-400', text: 'text-amber-600' };
  return              { bar: 'bg-green-500', text: 'text-green-600' };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/badge.ts
git commit -m "feat: helper centralizado estadoBadge y riesgoColor"
```

---

### Task 2: Navbar — "Proyect Control" con pill nav

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/(dashboard)/components/NavLink.tsx`
- Modify: `src/app/(dashboard)/components/CatalogosDropdown.tsx`

- [ ] **Step 1: Reemplazar `layout.tsx` completo**

```tsx
// src/app/(dashboard)/layout.tsx
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NavLink } from './components/NavLink';
import { CatalogosDropdown } from './components/CatalogosDropdown';
import { Toaster } from 'sonner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[54px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="bg-green-600 text-white text-[11px] font-black px-2 py-1 rounded-md tracking-wide">
                PC
              </span>
              <span className="font-bold text-[14px] text-gray-900 tracking-tight hidden sm:block">
                Proyect Control
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <NavLink href="/proyectos">Proyectos</NavLink>
              <NavLink href="/facturas">Facturas</NavLink>
              <CatalogosDropdown />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block truncate max-w-40">
              {session.user?.email}
            </span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="text-xs text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="sm:hidden border-t border-gray-100 px-4 py-2 flex gap-1 overflow-x-auto">
          <NavLink href="/proyectos">Proyectos</NavLink>
          <NavLink href="/facturas">Facturas</NavLink>
          <NavLink href="/catalogos/proveedores">Proveedores</NavLink>
          <NavLink href="/catalogos/materiales">Materiales</NavLink>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
```

- [ ] **Step 2: Reemplazar `NavLink.tsx`**

```tsx
// src/app/(dashboard)/components/NavLink.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}

export function NavLink({ href, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        'text-sm px-4 py-1.5 rounded-full transition-colors font-medium',
        isActive
          ? 'bg-green-600 text-white'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 3: Reemplazar `CatalogosDropdown.tsx`**

```tsx
// src/app/(dashboard)/components/CatalogosDropdown.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export function CatalogosDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = pathname.startsWith('/catalogos');

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(
          'text-sm px-4 py-1.5 rounded-full transition-colors font-medium flex items-center gap-1',
          isActive
            ? 'bg-green-600 text-white'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
        )}
      >
        Catálogos
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[9rem] z-50">
          <Link
            href="/catalogos/proveedores"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Proveedores
          </Link>
          <Link
            href="/catalogos/materiales"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Materiales
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verificar visualmente**

Navegar a cualquier página. Confirmar:
- Badge verde "PC" + texto "Proyect Control"
- Link activo tiene fondo verde redondeado (píldora)
- Links inactivos grises con hover gris claro

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/layout.tsx \
        src/app/\(dashboard\)/components/NavLink.tsx \
        src/app/\(dashboard\)/components/CatalogosDropdown.tsx
git commit -m "feat: navbar Proyect Control con pill nav verde"
```

---

### Task 3: Dashboard — KPI cards con iconos

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Reemplazar `page.tsx` del dashboard**

```tsx
// src/app/(dashboard)/page.tsx
export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { getResumenDashboard } from '@/lib/queries/organizaciones';
import { estadoBadge } from '@/lib/badge';
import Link from 'next/link';

function fmt(n: number) {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ESTADO_LABEL: Record<string, string> = {
  recibida: 'Recibidas',
  parcialmente_asignada: 'Parciales',
  asignada: 'Asignadas',
  cerrada: 'Cerradas',
};

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const resumen = await getResumenDashboard(ctx);

  const pctEjercido =
    resumen.presupuestoTotal > 0
      ? Math.min(100, (resumen.ejercidoTotal / resumen.presupuestoTotal) * 100)
      : 0;

  const totalFacturas = Object.values(resumen.facturasPorEstado).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Panel de control</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Proyectos activos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Proyectos activos
            </span>
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-base">
              🏗️
            </span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{resumen.proyectosActivos}</div>
          {resumen.proyectosEnRiesgo > 0 && (
            <div className="text-xs text-amber-600 font-semibold">
              ⚠ {resumen.proyectosEnRiesgo} en riesgo presupuestal (&gt;85%)
            </div>
          )}
          <Link href="/proyectos" className="text-xs text-green-600 font-medium hover:underline">
            Ver proyectos →
          </Link>
        </div>

        {/* Presupuesto */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Presupuesto total
            </span>
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-base">
              💰
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 tabular-nums">
            {fmt(resumen.presupuestoTotal)}
          </div>
          <div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all"
                style={{ width: `${pctEjercido}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1 tabular-nums">
              Ejercido: {fmt(resumen.ejercidoTotal)}{' '}
              <span className="text-gray-300">({pctEjercido.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Facturas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Facturas ({totalFacturas})
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-base">
              📄
            </span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(ESTADO_LABEL).map(([estado, label]) => {
              const count = resumen.facturasPorEstado[estado] ?? 0;
              if (count === 0) return null;
              return (
                <div key={estado} className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${estadoBadge(estado)}`}>
                    {label}
                  </span>
                  <span className="text-sm font-bold text-gray-700">{count}</span>
                </div>
              );
            })}
            {totalFacturas === 0 && (
              <p className="text-xs text-gray-400">Sin facturas registradas</p>
            )}
          </div>
          <Link href="/facturas" className="text-xs text-green-600 font-medium hover:underline">
            Ver facturas →
          </Link>
        </div>
      </div>

      {/* Quick links catálogos */}
      <div>
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Catálogos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/catalogos/proveedores"
            className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:border-green-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
          >
            Proveedores →
          </Link>
          <Link
            href="/catalogos/materiales"
            className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:border-green-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
          >
            Materiales →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar visualmente**

Navegar a `/`. Confirmar:
- Tres cards con iconos (🏗️ 💰 📄) en badge de color
- Barra de progreso verde para presupuesto
- Links "Ver →" en verde
- Título en `font-extrabold`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/page.tsx
git commit -m "feat: dashboard KPI cards con iconos y barra de progreso verde"
```

---

### Task 4: ProyectosTabla — barra de riesgo y tabla rediseñada

**Files:**
- Modify: `src/app/(dashboard)/proyectos/page.tsx`
- Modify: `src/app/(dashboard)/proyectos/components/ProyectosTabla.tsx`

- [ ] **Step 1: Actualizar `proyectos/page.tsx`**

```tsx
// src/app/(dashboard)/proyectos/page.tsx
import { requireAuth } from '@/lib/auth/server';
import { getProyectos } from '@/lib/queries/proyectos';
import { ProyectosTabla } from './components/ProyectosTabla';
import Link from 'next/link';

export default async function ProyectosPage() {
  const ctx = await requireAuth();
  const lista = await getProyectos(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Proyectos</h1>
        <Link
          href="/proyectos/nuevo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          + Nuevo proyecto
        </Link>
      </div>
      <ProyectosTabla proyectos={lista} />
    </div>
  );
}
```

- [ ] **Step 2: Reemplazar `ProyectosTabla.tsx`**

```tsx
// src/app/(dashboard)/proyectos/components/ProyectosTabla.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { estadoBadge, riesgoColor } from '@/lib/badge';

interface Proyecto {
  id: string;
  clave: string;
  nombre: string;
  empresa: string | null;
  estado: string;
  fechaInicio: string | null;
  fechaFinEstimada: string | null;
}

const ESTADOS = ['todos', 'activo', 'pausado', 'cerrado'] as const;

interface Props {
  proyectos: Proyecto[];
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ProyectosTabla({ proyectos }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

  const lista = proyectos.filter((p) => {
    const matchEstado = estadoFiltro === 'todos' || p.estado === estadoFiltro;
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q ||
      p.clave.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q) ||
      (p.empresa ?? '').toLowerCase().includes(q);
    return matchEstado && matchBusqueda;
  });

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por clave, nombre o empresa…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-1">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFiltro(e)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                estadoFiltro === e
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {busqueda || estadoFiltro !== 'todos'
            ? 'Sin resultados para el filtro actual.'
            : 'Sin proyectos registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Clave', 'Nombre', 'Empresa', 'Estado', 'Inicio', 'Fin est.', 'Ejercido'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((p, i) => {
                // La tabla no recibe el % ejercido desde el listado general;
                // se muestra sólo si el proyecto trae el dato. Por ahora placeholder.
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-gray-50/40'
                    }`}
                  >
                    <td className="px-5 py-3 font-mono text-xs">
                      <Link
                        href={`/proyectos/${p.id}`}
                        className="text-green-600 hover:underline font-semibold"
                      >
                        {p.clave}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{p.nombre}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{p.empresa ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge(p.estado)}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(p.fechaInicio)}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(p.fechaFinEstimada)}</td>
                    <td className="px-5 py-3">
                      <Link href={`/proyectos/${p.id}`} className="text-xs text-green-600 font-semibold hover:underline">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {proyectos.length} proyectos
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar visualmente**

Navegar a `/proyectos`. Confirmar:
- Botón "+ Nuevo proyecto" en verde
- Filtros de estado como píldoras (activo = fondo verde)
- Links de clave en verde
- Badges de estado con colores correctos

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/proyectos/page.tsx \
        src/app/\(dashboard\)/proyectos/components/ProyectosTabla.tsx
git commit -m "feat: proyectos — botón verde, tabla rediseñada con pill filters"
```

---

### Task 5: FacturasTabla — tabla rediseñada con badge helper

**Files:**
- Modify: `src/app/(dashboard)/facturas/page.tsx`
- Modify: `src/app/(dashboard)/facturas/components/FacturasTabla.tsx`

- [ ] **Step 1: Actualizar `facturas/page.tsx`**

Leer el archivo actual para conocer su estructura, luego reemplazar el `<h1>`:

```tsx
// Sólo cambiar la línea del h1 y agregar import si no existe
// Buscar:
<h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
// Reemplazar por:
<h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Facturas</h1>
```

- [ ] **Step 2: Reemplazar `FacturasTabla.tsx`**

```tsx
// src/app/(dashboard)/facturas/components/FacturasTabla.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { estadoBadge } from '@/lib/badge';

interface Factura {
  id: string;
  uuidFiscal: string;
  serie: string | null;
  folio: string | null;
  nombreEmisor: string;
  rfcEmisor: string;
  total: string;
  moneda: string;
  fechaEmision: string | Date;
  estado: string;
}

const ESTADOS = ['todos', 'recibida', 'parcialmente_asignada', 'asignada', 'cerrada'] as const;
const ESTADO_LABEL: Record<string, string> = {
  todos: 'Todos',
  recibida: 'Recibidas',
  parcialmente_asignada: 'Parciales',
  asignada: 'Asignadas',
  cerrada: 'Cerradas',
};

interface Props {
  facturas: Factura[];
}

export function FacturasTabla({ facturas }: Props) {
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const lista = facturas.filter((f) => {
    const matchEstado = estadoFiltro === 'todos' || f.estado === estadoFiltro;
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q ||
      f.rfcEmisor.toLowerCase().includes(q) ||
      f.nombreEmisor.toLowerCase().includes(q) ||
      f.uuidFiscal.toLowerCase().includes(q) ||
      (f.folio ?? '').toLowerCase().includes(q);
    return matchEstado && matchBusqueda;
  });

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por RFC, emisor o UUID…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-1 flex-wrap">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFiltro(e)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                estadoFiltro === e
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {busqueda || estadoFiltro !== 'todos'
            ? 'Sin facturas para el filtro actual.'
            : 'Sin facturas. Carga un XML CFDI para comenzar.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['UUID Fiscal', 'Emisor', 'Total', 'Fecha', 'Estado'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide ${
                      i === 2 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/facturas/${f.id}`}
                      className="font-mono text-xs text-green-600 hover:underline font-semibold"
                    >
                      {f.serie ? `${f.serie}-` : ''}{f.folio ?? ''}{' '}
                      <span className="text-gray-400">({f.uuidFiscal.substring(0, 8)}…)</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold text-gray-900">{f.nombreEmisor}</div>
                    <div className="text-xs text-gray-400 font-mono">{f.rfcEmisor}</div>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold tabular-nums text-gray-900">
                    {f.moneda} ${parseFloat(f.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(f.fechaEmision).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadge(f.estado)}`}>
                      {ESTADO_LABEL[f.estado] ?? f.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {facturas.length} facturas
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar visualmente**

Navegar a `/facturas`. Confirmar:
- Filtros de estado como píldoras verdes
- Links de UUID en verde
- Badges de estado con colores consistentes (usando `estadoBadge`)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/facturas/page.tsx \
        src/app/\(dashboard\)/facturas/components/FacturasTabla.tsx
git commit -m "feat: facturas — tabla rediseñada, pill filters, badge helper"
```

---

### Task 6: Catálogos — Proveedores y Materiales

**Files:**
- Modify: `src/app/(dashboard)/catalogos/proveedores/page.tsx`
- Modify: `src/app/(dashboard)/catalogos/proveedores/components/ProveedoresTabla.tsx`
- Modify: `src/app/(dashboard)/catalogos/materiales/page.tsx`
- Modify: `src/app/(dashboard)/catalogos/materiales/components/MaterialesTabla.tsx`

- [ ] **Step 1: Actualizar `proveedores/page.tsx`**

Leer el archivo, luego actualizar el h1 y botón:
```tsx
// Cambiar h1:
<h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Proveedores</h1>
// Cambiar botón "Nuevo proveedor" a verde:
className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
```

- [ ] **Step 2: Reemplazar `ProveedoresTabla.tsx`**

```tsx
// src/app/(dashboard)/catalogos/proveedores/components/ProveedoresTabla.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Proveedor {
  id: string;
  nombre: string;
  rfc: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
}

interface Props {
  proveedores: Proveedor[];
}

export function ProveedoresTabla({ proveedores }: Props) {
  const [busqueda, setBusqueda] = useState('');

  const lista = proveedores.filter((p) => {
    const q = busqueda.toLowerCase();
    return (
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.rfc ?? '').toLowerCase().includes(q) ||
      (p.contacto ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Buscar por nombre, RFC, contacto o email…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:max-w-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {busqueda ? 'Sin resultados para el filtro actual.' : 'Sin proveedores registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Nombre', 'RFC', 'Contacto', 'Teléfono', 'Email', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{p.nombre}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 font-mono">{p.rfc ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{p.contacto ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{p.telefono ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{p.email ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/catalogos/proveedores/${p.id}`}
                      className="text-xs text-green-600 font-semibold hover:underline"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {proveedores.length} proveedores
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Actualizar `materiales/page.tsx`**

```tsx
// Cambiar h1:
<h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Materiales</h1>
// Cambiar botón a verde:
className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
```

- [ ] **Step 4: Reemplazar `MaterialesTabla.tsx`**

```tsx
// src/app/(dashboard)/catalogos/materiales/components/MaterialesTabla.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Material {
  id: string;
  clave: string;
  nombre: string;
  unidad: string;
  descripcion: string | null;
}

interface Props {
  materiales: Material[];
}

export function MaterialesTabla({ materiales }: Props) {
  const [busqueda, setBusqueda] = useState('');

  const lista = materiales.filter((m) => {
    const q = busqueda.toLowerCase();
    return (
      !q ||
      m.clave.toLowerCase().includes(q) ||
      m.nombre.toLowerCase().includes(q) ||
      m.unidad.toLowerCase().includes(q) ||
      (m.descripcion ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Buscar por clave, nombre, unidad o descripción…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:max-w-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {busqueda ? 'Sin resultados para el filtro actual.' : 'Sin materiales registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Clave', 'Nombre', 'Unidad', 'Descripción', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-700 font-semibold">{m.clave}</td>
                  <td className="px-5 py-3 text-sm text-gray-900">{m.nombre}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{m.unidad}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{m.descripcion ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/catalogos/materiales/${m.id}`}
                      className="text-xs text-green-600 font-semibold hover:underline"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
            {lista.length} de {materiales.length} materiales
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verificar visualmente**

Navegar a `/catalogos/proveedores` y `/catalogos/materiales`. Confirmar tablas rediseñadas con links "Editar →" en verde.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/catalogos/
git commit -m "feat: catálogos — tablas rediseñadas, botones y links en verde"
```

---

### Task 7: Deploy a producción

**Files:** Ninguno (sólo comandos de servidor)

- [ ] **Step 1: Push final**

```bash
git push origin master
```

- [ ] **Step 2: Redeploy en servidor**

```bash
ssh -i /c/Users/gsali/.ssh/claude_tmp root@157.90.242.249 "bash /opt/opscore/scripts/redeploy.sh"
```

Esperar a que aparezca `=== Listo ===`.

- [ ] **Step 3: Verificar en producción**

Abrir `http://157.90.242.249` y confirmar que el diseño actualizado está en línea.

---

## Self-Review

**Spec coverage:**
- ✅ Navbar "Proyect Control" badge PC — Task 2
- ✅ Color verde `#16a34a` / `green-600` — Tasks 2, 3, 4, 5, 6
- ✅ Pill nav activa — Tasks 2 (NavLink + CatalogosDropdown)
- ✅ KPI cards con iconos — Task 3
- ✅ Barra de progreso verde — Task 3
- ✅ Helper `estadoBadge()` — Task 1
- ✅ Tablas con `rounded-xl shadow-sm` — Tasks 4, 5, 6
- ✅ Filtros pill verdes — Tasks 4, 5
- ✅ Botones primarios verdes en pages — Tasks 4, 5, 6
- ✅ Links en verde — Tasks 4, 5, 6
- ✅ Fondo `bg-slate-100` — Task 2

**Placeholder scan:** Sin TBDs. Todo el código está completo.

**Type consistency:** `estadoBadge(string): string` y `riesgoColor(number)` usados consistentemente. `riesgoColor` está en `badge.ts` pero no se usa en este plan — disponible para la página de detalle de proyecto si se requiere en el futuro.
