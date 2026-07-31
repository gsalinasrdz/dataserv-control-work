import { requireAuth } from '@/lib/auth/server';
import { getFrentesConTrabajos } from '@/lib/queries/frentes';
import { FrenteSection } from './components/FrenteSection';
import { createFrente } from '@/lib/actions/frentes';
import Link from 'next/link';

export default async function ProyectoTrabajosPage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const ctx = await requireAuth();
  const frentesData = await getFrentesConTrabajos(ctx, proyectoId);

  async function handleCreateFrente(formData: FormData) {
    'use server';
    await createFrente(proyectoId, formData);
  }

  return (
    <div className="space-y-4">
      {frentesData.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm mb-3">
            Sin frentes de trabajo. Puedes agregar uno abajo o importar partidas desde CSV.
          </p>
          <Link
            href={`/proyectos/${proyectoId}/importar`}
            className="text-sm text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-50"
          >
            Importar CSV
          </Link>
        </div>
      ) : (
        frentesData.map((f) => (
          <FrenteSection
            key={f.id}
            frenteId={f.id}
            proyectoId={proyectoId}
            clave={f.clave}
            nombre={f.nombre}
            trabajos={f.trabajos}
          />
        ))
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar frente de trabajo</h3>
        <form action={handleCreateFrente} className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Clave</label>
            <input
              name="clave"
              required
              placeholder="EST"
              className="border rounded px-2 py-1.5 text-sm font-mono w-24 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input
              name="nombre"
              required
              placeholder="Estructura"
              className="border rounded px-2 py-1.5 text-sm w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Orden</label>
            <input
              name="orden"
              type="number"
              defaultValue="0"
              className="border rounded px-2 py-1.5 text-sm w-16 text-right"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-800 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-700"
          >
            Agregar frente
          </button>
        </form>
      </div>
    </div>
  );
}
