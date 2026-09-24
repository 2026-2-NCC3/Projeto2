export default function Placeholder({ title, description }) {
    return (<div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{title}</h1>
      <p className="text-sm text-gray-500">{description}</p>
      <div className="mt-8 flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-white">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-3xl">🚧</span>
        </div>
        <p className="text-sm font-medium text-gray-500">Em desenvolvimento</p>
        <p className="text-xs text-gray-400 mt-1">Esta seção será implementada em breve</p>
      </div>
    </div>);
}
