import { LangRow } from '@/types/game_detail';
import { buildLanguageRows } from '@/utils/pcgw';

interface LangDotProps {
  has: boolean;
}

function LangDot({ has }: LangDotProps) {
  return has ? (
    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
  ) : (
    <span className="bg-muted-foreground/20 inline-block h-2 w-2 rounded-full" />
  );
}

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
  const rows: LangRow[] = buildLanguageRows(iface, audio, subtitles);

  if (rows.length === 0) return null;

  return (
    <div className="border-border/50 overflow-hidden rounded-lg border">
      <table className="w-full">
        <thead className="bg-muted/20">
          <tr>
            <th className="text-muted-foreground px-4 py-2 text-left text-xs tracking-wider uppercase">
              Idioma
            </th>
            <th className="text-muted-foreground px-2 py-2 text-center text-xs tracking-wider uppercase">
              Interface
            </th>
            <th className="text-muted-foreground px-2 py-2 text-center text-xs tracking-wider uppercase">
              Áudio
            </th>
            <th className="text-muted-foreground px-2 py-2 text-center text-xs tracking-wider uppercase">
              Legendas
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.lang}
              className="border-border/30 border-b last:border-0"
            >
              <td className="text-foreground px-4 py-2 text-xs">{row.lang}</td>
              <td className="px-2 py-2 text-center">
                <LangDot has={row.interface} />
              </td>
              <td className="px-2 py-2 text-center">
                <LangDot has={row.audio} />
              </td>
              <td className="px-2 py-2 text-center">
                <LangDot has={row.subtitles} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
