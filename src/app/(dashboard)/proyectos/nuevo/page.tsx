import { ProyectoForm } from '../components/ProyectoForm';

export default function NuevoProyectoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nuevo proyecto</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProyectoForm />
      </div>
    </div>
  );
}
