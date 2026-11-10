import AttendanceRecords from "../components/AttendanceRecords"
import { administradorAutorizado } from "../utils/checkin"

export default function Attendance({ usuario }) {
  if (!administradorAutorizado(usuario)) {
    return (
      <p role="alert" className="p-6 text-red-700">
        Acesso restrito a administradores.
      </p>
    )
  }
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Presenças</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Registros confirmados pela API. A ausência de registro não comprova
          falta.
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <AttendanceRecords />
      </div>
    </div>
  )
}
