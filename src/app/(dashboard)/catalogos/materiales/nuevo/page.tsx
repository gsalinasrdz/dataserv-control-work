'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { createMaterial } from '@/lib/actions/catalogos';

export default function NuevoMaterialPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createMaterial(formData);
        toast.success('Material creado');
        router.push('/catalogos/materiales');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear material');
      }
    });
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Nuevo material</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clave *</label>
              <input name="clave" required placeholder="CONC-FC250" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
              <input name="unidad" required placeholder="m3" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input name="nombre" required placeholder="Concreto FC-250" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="descripcion" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={pending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {pending ? 'Guardando...' : 'Crear material'}
            </button>
            <button type="button" onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
