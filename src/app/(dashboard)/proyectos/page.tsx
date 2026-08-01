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
