function StatCard({ icon: Icon, value, label, color = 'blue' }) {
  const colorClasses = {
    cyan: 'bg-cyan-100 text-cyan-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{label}</p>
        </div>
        <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
