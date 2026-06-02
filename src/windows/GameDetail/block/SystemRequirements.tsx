import { ChevronDown, ChevronUp, Monitor } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Sysreq } from '@/types';
import { combineParts, formatOs } from '@/utils/pcgw';

interface SysreqRowProps {
  label: string;
  min: string | null;
  rec: string | null;
}

function SysreqRow({ label, min, rec }: SysreqRowProps) {
  if (!min && !rec) return null;

  return (
    <tr className="border-border/30 border-b last:border-0">
      <td className="text-muted-foreground py-2 pr-3 text-xs font-medium">
        {label}
      </td>
      <td className="text-foreground py-2 pr-3 text-xs">{min ?? '—'}</td>
      <td className="text-foreground py-2 text-xs">{rec ?? '—'}</td>
    </tr>
  );
}

interface SystemRequirementsProps {
  req: Sysreq;
}

export function SystemRequirements({ req }: SystemRequirementsProps) {
  const { t } = useTranslation('game_detail');
  const [expanded, setExpanded] = useState(true);

  const title = req.tier_title
    ? `${req.os_family} — ${req.tier_title}`
    : req.os_family;

  return (
    <div className="border-border/50 mb-3 overflow-hidden rounded-lg border">
      <button
        onClick={() => setExpanded(e => !e)}
        className="hover:bg-muted/30 flex w-full items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Monitor className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-sm font-medium">{title}</span>
          {req.target && (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
              {req.target}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pt-2 pb-4">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-muted-foreground pb-2 text-left text-xs tracking-wider uppercase">
                  {t('system_requirements_th_component')}
                </th>
                <th className="text-muted-foreground pb-2 text-left text-xs tracking-wider uppercase">
                  {t('system_requirements_th_minimum')}
                </th>
                <th className="text-muted-foreground pb-2 text-left text-xs tracking-wider uppercase">
                  {t('system_requirements_th_recommended')}
                </th>
              </tr>
            </thead>
            <tbody>
              <SysreqRow
                label="OS"
                min={formatOs(req.os_family, req.min_os)}
                rec={formatOs(req.os_family, req.rec_os)}
              />
              <SysreqRow
                label="CPU"
                min={combineParts(req.min_cpu, req.min_cpu2)}
                rec={combineParts(req.rec_cpu, req.rec_cpu2)}
              />
              <SysreqRow label="RAM" min={req.min_ram} rec={req.rec_ram} />
              <SysreqRow
                label="GPU"
                min={combineParts(req.min_gpu, req.min_gpu2)}
                rec={combineParts(req.rec_gpu, req.rec_gpu2)}
              />
              <SysreqRow label="VRAM" min={req.min_vram} rec={req.rec_vram} />
              <SysreqRow label="DirectX" min={req.min_dx} rec={req.rec_dx} />
              <SysreqRow
                label={t('system_requirements_label_storage')}
                min={req.min_storage}
                rec={req.rec_storage}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
