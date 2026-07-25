'use client';

import { useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { importarTrabajosCSV } from '@/lib/actions/importar';
import Link from 'next/link';

const CSV_EJEMPLO = `frente_clave,frente_nombre,frente_orden,trabajo_clave,trabajo_nombre,unidad,cantidad,precio_unitario
EST,Estructura,1,EST-001,Trazo y nivelación,m2,1500.00,45.50
EST,Estructura,1,EST-002,Excavación,m3,800.00,320.00
ACB,Acabados,2,ACB-001,Pintura interior,m2,3500.00,85.00`;

export default function ImportarCSVPage() {
  const params = useParams<{ proyectoId: string }>();
  const router = useRouter();
  const [csvText, setCsvText] = useState('');
  const [resultado, setResultado] = useState<{
    frentesCreados: number;
    trabajosCreados: number;
    trabajosActualizados: number;
    errores: string[];
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string);
    reader.readAsText(file, 'utf-8');
  }

  function handleImport() {
    startTransition(async () => {
      const res = await importarTrabajosCSV(params.proyectoId, csvText);
      setResultado(res);
      if (res.errores.length === 0) {
        setTimeout(() => router.push(`/proyectos/${params.proyectoId}`), 1500);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/proyectos" className="hover:text-gray-700">Proyectos</Link>
        <span>/</span>
        <Link href={`/proyectos/${params.proyectoId}`} className="hover:text-gray-700">Proyecto</Link>
        <span>/</span>
        <span>Importar CSV</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Importar trabajos desde CSV</h1>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs">
        <div className="font-medium text-gray-700 mb-2">Formato esperado:</div>
        <pre className="text-gray-600 overflow-x-auto">{CSV_EJEMPLO}</pre>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo CSV</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="text-sm text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            O pega el contenido aquí
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={CSV_EJEMPLO}
          />
        </div>

        <button
          onClick={handleImport}
          disabled={pending || !csvText.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {resultado && (
        <div className={`rounded-lg p-4 border ${resultado.errores.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          {resultado.errores.length > 0 ? (
            <div>
              <div className="font-medium text-red-800 mb-2">Errores en el CSV:</div>
              <ul className="text-sm text-red-700 space-y-1">
                {resultado.errores.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          ) : (
            <div className="text-green-800 text-sm">
              <div className="font-medium mb-1">Importación exitosa</div>
              <ul className="space-y-0.5">
                <li>Frentes creados: {resultado.frentesCreados}</li>
                <li>Trabajos creados: {resultado.trabajosCreados}</li>
                <li>Trabajos actualizados: {resultado.trabajosActualizados}</li>
              </ul>
              <p className="mt-2 text-xs text-green-600">Redirigiendo al proyecto...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
