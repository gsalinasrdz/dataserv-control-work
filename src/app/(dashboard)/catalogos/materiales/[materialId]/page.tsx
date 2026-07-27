import { requireAuth } from '@/lib/auth/server';
import { getMaterial } from '@/lib/queries/materiales';
import { notFound } from 'next/navigation';
import { MaterialEditForm } from './components/MaterialEditForm';

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { materialId } = await params;
  const ctx = await requireAuth();
  const material = await getMaterial(ctx, materialId);
  if (!material) notFound();
  return <MaterialEditForm material={material} />;
}
