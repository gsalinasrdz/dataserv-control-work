import { requireAuth } from '@/lib/auth/server';
import { getProyecto } from '@/lib/queries/proyectos';
import { notFound } from 'next/navigation';
import { ProyectoEditForm } from './components/ProyectoEditForm';

export default async function ProyectoEditPage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const ctx = await requireAuth();
  const proyecto = await getProyecto(ctx, proyectoId);
  if (!proyecto) notFound();
  return <ProyectoEditForm proyecto={proyecto} />;
}
