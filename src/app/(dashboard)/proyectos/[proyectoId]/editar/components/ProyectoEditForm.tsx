'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { updateProyecto } from '@/lib/actions/proyectos';

interface Proyecto {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string | Date | null;
  fechaFinEstimada: string | Date | null;
}

interface Props {
  proyecto: Proyecto;
}

function toDateInput(val: string | Date | null): string {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val);
  return d.toISOString().split('T')[0] ?? '';
}

export function ProyectoEditForm({ proyecto }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateProyecto(proyecto.id, formData);
        toast.success('Proyecto actualizado');
        router.push('/proyectos/' + proyecto.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar');
      }
    });
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1">
        <Link href="/proyectos" className="hover:text-gray-700">
          Proyectos
        </Link>
        <span>/</span>
        <Link href={`/proyectos/${proyecto.id}`} className="hover:text-gray-700 font-mono">
          {proyecto.clave}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Editar</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Editar proyecto</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clave *</label>
            <input
              name="clave"
              required
              defaultValue={proyecto.clave}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Código único del proyecto (se convierte a mayúsculas).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              name="nombre"
              required
              defaultValue={proyecto.nombre}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              rows={3}
              defaultValue={proyecto.descripcion ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                name="fecha_inicio"
                type="date"
                defaultValue={toDateInput(proyecto.fechaInicio)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin estimada</label>
              <input
                name="fecha_fin_estimada"
                type="date"
                defaultValue={toDateInput(proyecto.fechaFinEstimada)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
