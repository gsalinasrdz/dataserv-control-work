'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cargarFactura } from '@/lib/actions/cfdi';
import { cn } from '@/lib/cn';

export function SubirXmlForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function processFile(file: File) {
    if (!file.name.endsWith('.xml') && file.type !== 'text/xml' && file.type !== 'application/xml') {
      setError('El archivo debe ser un XML CFDI (.xml)');
      return;
    }
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  if (pending) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        Procesando XML…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-xs text-red-600 max-w-xs text-right">{error}</p>}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-dashed transition-all',
          dragging
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
        )}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {dragging ? 'Suelta el XML aquí' : 'Cargar XML'}
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>
      <p className="text-xs text-gray-400">CFDI 4.0 (.xml)</p>
    </div>
  );
}
