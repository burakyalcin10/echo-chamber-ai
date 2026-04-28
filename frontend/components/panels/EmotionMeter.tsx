"use client";

interface EmotionMeterProps {
  label: string;
  value: number; // 0-1
  colorClass?: string;
}

export default function EmotionMeter({
  label,
  value,
  colorClass = "bg-primary",
}: EmotionMeterProps) {
  const percent = Math.round(value * 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-data-mono text-[10px]">
        <span className="text-stone-300">{label}</span>
        <span className="text-primary">{percent}%</span>
      </div>
      <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} animate-meter-fill`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
