import { ChevronDown, ChevronUp, Languages } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LangRow } from '@/types';
import { buildLanguageRows } from '@/utils/pcgw';
import { BoolBadge } from '@/windows';

interface LanguageTableProps {
  interface: string[] | null;
  audio: string[] | null;
  subtitles: string[] | null;
}

export function LanguageTable({
  interface: iface,
  audio,
  subtitles,
}: LanguageTableProps) {
  const { t } = useTranslation('game_detail');
  const [expanded, setExpanded] = useState(false);
  const rows: LangRow[] = buildLanguageRows(iface, audio, subtitles);

  if (rows.length === 0) return null;

  return (
    <div className="border-border/50 overflow-hidden rounded-lg border">
      {/* Header com collapse */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="hover:bg-muted/30 flex w-full items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Languages className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-sm font-medium">
            {t('language_table_title')}
          </span>
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
            {rows.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {/* Tabela com scroll interno */}
      {expanded && (
        <div className="custom-scrollbar max-h-48 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-primary-foreground sticky top-0">
              <tr>
                <th className="text-muted-foreground px-4 py-2 text-left text-xs tracking-wider uppercase">
                  {t('language_table_th_language')}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-center text-xs tracking-wider uppercase">
                  {t('language_table_th_interface')}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-center text-xs tracking-wider uppercase">
                  {t('language_table_th_audio')}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-center text-xs tracking-wider uppercase">
                  {t('language_table_th_subtitles')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.lang}
                  className="border-border/30 border-b last:border-0"
                >
                  <td className="text-foreground px-4 py-2 text-xs">
                    {row.lang}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center">
                      <BoolBadge
                        value={row.interface ? 'true' : 'false'}
                        label=""
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center">
                      <BoolBadge
                        value={row.audio ? 'true' : 'false'}
                        label=""
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center">
                      <BoolBadge
                        value={row.subtitles ? 'true' : 'false'}
                        label=""
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
