import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelOff?: string;
  labelOn?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  labelOff = 'Desativado',
  labelOn = 'Ativado',
  className = '',
}) => {
  return (
    <label
      className={`relative inline-flex cursor-pointer items-center gap-3 ${className}`}
    >
      <span
        className={`text-sm font-medium transition-colors ${
          !checked ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {labelOff}
      </span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <div className="peer bg-input relative h-6 w-11 rounded-full after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5 peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-800"></div>
      <span
        className={`text-sm font-medium transition-colors ${
          checked ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {labelOn}
      </span>
    </label>
  );
};
