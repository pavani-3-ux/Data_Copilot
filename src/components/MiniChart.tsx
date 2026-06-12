interface MiniChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  type: 'donut' | 'bar';
}

export default function MiniChart({ data, type }: MiniChartProps) {
  if (type === 'donut') {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90;

    return (
      <div className="flex items-center justify-center gap-4">
        <svg className="w-24 h-24" viewBox="0 0 100 100">
          {data.map((d, i) => {
            const percentage = (d.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            const pathD = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

            return <path key={i} d={pathD} fill={d.color || '#3b82f6'} />;
          })}
          <circle cx="50" cy="50" r="25" fill="#0f172a" />
        </svg>
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: d.color || '#3b82f6' }}
              />
              <span className="text-xs text-secondary-400">{d.name}</span>
              <span className="text-xs text-white font-medium">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'bar') {
    const maxValue = Math.max(...data.map((d) => d.value));

    return (
      <div className="flex items-end gap-2 h-20">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t transition-all duration-300"
              style={{
                height: `${(d.value / maxValue) * 60}px`,
                backgroundColor: d.color || '#3b82f6',
              }}
            />
            <span className="text-xs text-secondary-500 truncate w-full text-center">{d.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
