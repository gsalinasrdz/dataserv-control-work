import { requireAuth } from '@/lib/auth/server';
import { getFacturas } from '@/lib/queries/facturas';
import { SubirXmlForm } from './components/SubirXmlForm';
import { FacturasTabla } from './components/FacturasTabla';

export default async function FacturasPage() {
  const ctx = await requireAuth();
  const facturasList = await getFacturas(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Facturas</h1>
        <SubirXmlForm />
      </div>

      <FacturasTabla facturas={facturasList} />
    </div>
  );
}
