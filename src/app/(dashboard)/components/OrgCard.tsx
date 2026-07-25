interface Props {
  nombre: string;
  rfc?: string | null;
  organizacionId: string;
}

export function OrgCard({ nombre, rfc, organizacionId }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Organización activa</p>
      <h2 className="text-xl font-semibold text-gray-900">{nombre}</h2>
      {rfc && <p className="text-sm text-gray-500 mt-1">RFC: {rfc}</p>}
      <p className="text-xs text-gray-300 mt-3 font-mono">{organizacionId}</p>
    </div>
  );
}
