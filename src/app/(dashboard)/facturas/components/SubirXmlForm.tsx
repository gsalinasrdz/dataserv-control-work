'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cargarFactura } from '@/lib/actions/cfdi';

export function SubirXmlForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const xml = ev.target?.result as string;
      startTransition(async () => {
        const result = await cargarFactura(xml);
        if (result.ok) {
          router.push(`/facturas/${result.facturaId}`);
        } else {
          setError(result.error);
          if (inputRef.current) inputRef.current.value = '';
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <p className="text-sm text-red-600 max-w-xs">{error}</p>
      )}
      <label className={`cursor-pointer inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${pending ? 'opacity-50 pointer-events-none' : ''}`}>
        {pending ? 'Cargando…' : 'Cargar XML'}
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>
    </div>
  );
}
