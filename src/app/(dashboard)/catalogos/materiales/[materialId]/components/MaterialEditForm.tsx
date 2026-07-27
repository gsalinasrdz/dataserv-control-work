'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { updateMaterial, deleteMaterial } from '@/lib/actions/catalogos';

interface Material {
  id: string;
  clave: string;
  nombre: string;
  unidad: string;
  descripcion: string | null;
}

interface Props {
  material: Material;
}

export function MaterialEditForm({ material }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateMaterial(material.id, formData);
        toast.success('Material actualizado');
        router.push('/catalogos/materiales');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar');
      }
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `¿Eliminar "${material.clave} — ${material.nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteMaterial(material.id);
        toast.success('Material eliminado');
        router.push('/catalogos/materiales');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar');
      }
    });
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1">
        <Link href="/catalogos/materiales" className="hover:text-gray-700">
          Materiales
        </Link>
        <span>/</span>
        <span className="text-gray-900">
          {material.clave} — {material.nombre}
        </span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Editar material</h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clave *</label>
              <input
                name="clave"
                required
                defaultValue={material.clave}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
              <input
                name="unidad"
                required
                defaultValue={material.unidad}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              name="nombre"
              required
              defaultValue={material.nombre}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              name="descripcion"
              defaultValue={material.descripcion ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
