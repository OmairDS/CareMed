export default function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <div className="text-2xl font-medium text-navy">{value}</div>
      <div className="text-sm text-navy-light/60">{label}</div>
    </div>
  );
}
