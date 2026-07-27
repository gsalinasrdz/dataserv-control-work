import { requireAuth } from '@/lib/auth/server';
import { getProveedor } from '@/lib/queries/proveedores';
import { notFound } from 'next/navigation';
import { ProveedorEditForm } from './components/ProveedorEditForm';

export default async function ProveedorDetailPage({
  params,
}: {
  params: Promise<{ proveedorId: string }>;
}) {
  const { proveedorId } = await params;
  const ctx = await requireAuth();
  const proveedor = await getProveedor(ctx, proveedorId);
  if (!proveedor) notFound();
  return <ProveedorEditForm proveedor={proveedor} />;
}
