import React from 'react';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  leftLabel: (value: number) => string;
  rightLabel: (value: number) => string;
  description: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  leftLabel,
  rightLabel,
  description,
}) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="text-muted-foreground flex justify-between text-xs font-medium">
        <span>{leftLabel(value)}</span>
        <span>{rightLabel(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
      />
      <p className="text-muted-foreground text-xs">{description(value)}</p>
    </div>
  );
};
