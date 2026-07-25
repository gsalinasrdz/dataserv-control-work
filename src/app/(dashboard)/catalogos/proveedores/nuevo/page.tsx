'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { createProveedor } from '@/lib/actions/catalogos';

export default function NuevoProveedorPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createProveedor(formData);
        router.push('/catalogos/proveedores');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al crear proveedor');
      }
    });
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Nuevo proveedor</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input name="nombre" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
            <input name="rfc" maxLength={13} placeholder="AAA010101AAA" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
            <input name="contacto" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="telefono" type="tel" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={pending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {pending ? 'Guardando...' : 'Crear proveedor'}
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
