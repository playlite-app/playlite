import { invoke } from '@tauri-apps/api/core';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTheme } from '@/hooks/ui/useTheme';
import { Game } from '@/types/game';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';

/**
 * Funcao auxiliar para calcular peso de um jogo com base na atividade do usuario.
 *
 * @param game
 */
function calculateWeightLocal(game: Game): number {
  const MINUTES_PER_HOUR = 60;
  const MAX_HOURS = 100;
  const WEIGHT_PLAYTIME = 0.1;
  const WEIGHT_FAVORITE = 2.0;
  const WEIGHT_RATING = 0.5;

  const hours = Math.min((game.playtime ?? 0) / MINUTES_PER_HOUR, MAX_HOURS);
  let weight = 1.0 + hours * WEIGHT_PLAYTIME;

  if (game.favorite) weight += WEIGHT_FAVORITE;

  if (game.userRating != null) weight += game.userRating * WEIGHT_RATING;

  return weight;
}

interface Props {
  userGames: Game[];
  open: boolean;
  onClose: () => void;
}

/**
 * Componente de diagnóstico para a funcionalidade de "Similares ao Perfil".
 * Permite testar e inspecionar a função de similaridade diretamente no frontend.
 * Útil para desenvolvimento e depuração, especialmente para validar a lógica de peso e os resultados do invoke.
 *
 * Funcionalidades:
 * - Exibe o status do invoke (carregando, erro, resultados)
 * - Mostra os top 5 jogos por peso calculado localmente
 * - Exibe os resultados retornados pelo invoke
 * - Permite reexecutar o invoke manualmente
 * - Mostra uma amostra dos jogos do usuário para referência
 */
export function ProfileSimilarDebug({ userGames, open, onClose }: Props) {
  const { isDark } = useTheme();

  const [invokeResult, setInvokeResult] = useState<unknown>(null);
  const [invokeError, setInvokeError] = useState<string | null>(null);
  const [invokeStatus, setInvokeStatus] = useState<'idle' | 'loading' | 'done'>(
    'idle'
  );

  // Cores adaptadas ao tema
  const colors = {
    success: isDark ? '#4ade80' : '#16a34a',
    error: isDark ? '#f87171' : '#dc2626',
    warning: isDark ? '#facc15' : '#ca8a04',
    info: isDark ? '#60a5fa' : '#2563eb',
    lime: isDark ? '#a3e635' : '#65a30d',
    muted: isDark ? '#555' : '#9ca3af',
    muted2: isDark ? '#444' : '#6b7280',
    divider: isDark ? '#1e1e1e' : '#e5e7eb',
    fg: isDark ? '#e2e8f0' : '#1e293b',
    btnBg: isDark ? '#1e3a5f' : '#dbeafe',
    btnBorder: isDark ? '#2563eb' : '#93c5fd',
    btnColor: isDark ? '#93c5fd' : '#1d4ed8',
  };

  const topByWeight = [...userGames]
    .map(g => ({ name: g.name, id: g.id, weight: calculateWeightLocal(g) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  const runInvoke = async () => {
    setInvokeStatus('loading');
    setInvokeError(null);
    setInvokeResult(null);

    try {
      const result = await invoke('get_profile_similar_games', { userGames });
      setInvokeResult(result);
    } catch (err) {
      setInvokeError(typeof err === 'string' ? err : JSON.stringify(err));
    } finally {
      setInvokeStatus('done');
    }
  };

  // Roda automaticamente ao abrir
  useEffect(() => {
    if (open && userGames.length > 0) {
      setInvokeStatus('idle');
      runInvoke();
    }
  }, [open]);

  const resultArray = Array.isArray(invokeResult) ? invokeResult : null;

  // Ícone e cor do status do invoke
  const invokeStatusDisplay = (() => {
    if (invokeStatus === 'idle') {
      return { icon: null, label: 'aguardando', color: colors.muted };
    }

    if (invokeStatus === 'loading') {
      return {
        icon: (
          <Loader2
            size={11}
            className="animate-spin"
            style={{ display: 'inline', marginRight: 4 }}
          />
        ),
        label: 'carregando...',
        color: colors.warning,
      };
    }

    if (invokeError) {
      return {
        icon: (
          <XCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
        ),
        label: 'erro',
        color: colors.error,
      };
    }

    return {
      icon: (
        <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />
      ),
      label: `${resultArray?.length ?? 0} resultados`,
      color: colors.success,
    };
  })();

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="border-border bg-background max-w-lg font-mono text-sm">
        <DialogHeader>
          <DialogTitle className="text-muted-foreground flex items-center justify-between tracking-wide">
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span>DIAGNÓSTICO — SIMILARES AO PERFIL</span>
            </div>
            <button onClick={onClose} />
          </DialogTitle>
        </DialogHeader>

        <div
          className="custom-scrollbar"
          style={{
            overflowY: 'auto',
            maxHeight: 500,
            padding: 4,
          }}
        >
          {/* Status geral */}
          <Section
            title="STATUS"
            dividerColor={colors.divider}
            labelColor={colors.muted2}
          >
            <Row
              label="userGames"
              value={`${userGames.length} jogos`}
              color={userGames.length > 0 ? colors.success : colors.error}
            />
            <Row
              label="invoke"
              value={
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {invokeStatusDisplay.icon}
                  {invokeStatusDisplay.label}
                </span>
              }
              color={invokeStatusDisplay.color}
            />
          </Section>

          {/* Top 5 por peso */}
          <Section
            title="TOP 5 POR PESO (frontend)"
            dividerColor={colors.divider}
            labelColor={colors.muted2}
          >
            {topByWeight.length === 0 ? (
              <Warn color={colors.warning}>Nenhum jogo em userGames</Warn>
            ) : (
              topByWeight.map((g, i) => (
                <Row
                  key={g.id}
                  label={`#${i + 1} ${truncate(g.name, 26)}`}
                  value={`peso ${g.weight.toFixed(2)}`}
                  color={i < 2 ? colors.info : colors.muted}
                />
              ))
            )}
          </Section>

          {/* Erro */}
          {invokeError && (
            <Section
              title="ERRO DO INVOKE"
              dividerColor={colors.divider}
              labelColor={colors.muted2}
            >
              <div
                style={{
                  color: colors.error,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.5,
                }}
              >
                {invokeError}
              </div>
            </Section>
          )}

          {/* Resultados */}
          {resultArray && (
            <Section
              title={`RESULTADOS (${resultArray.length})`}
              dividerColor={colors.divider}
              labelColor={colors.muted2}
            >
              {resultArray.length === 0 ? (
                <Warn color={colors.warning}>
                  {`Invoke OK mas retornou vazio. Causas prováveis:\n• Todos os similares já estão na biblioteca\n• GameBrain não encontrou similares\n• Nomes dos jogos âncora não foram resolvidos`}
                </Warn>
              ) : (
                resultArray
                  .slice(0, 8)
                  .map((g: any, i: number) => (
                    <Row
                      key={g.id ?? i}
                      label={truncate(g.name ?? '?', 26)}
                      value={`≈ ${truncate(g.because_of ?? '?', 18)}`}
                      color={colors.lime}
                    />
                  ))
              )}
              {resultArray.length > 8 && (
                <div style={{ color: colors.muted, marginTop: 4 }}>
                  +{resultArray.length - 8} mais...
                </div>
              )}
            </Section>
          )}

          {/* Amostra dos jogos */}
          <Section
            title="AMOSTRA userGames[0..2]"
            dividerColor={colors.divider}
            labelColor={colors.muted2}
          >
            {userGames.slice(0, 3).map(g => (
              <div
                key={g.id}
                style={{
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: `1px solid ${colors.divider}`,
                }}
              >
                <Row
                  label="name"
                  value={truncate(g.name, 28)}
                  color={colors.fg}
                />
                <Row
                  label="id"
                  value={truncate(g.id, 28)}
                  color={colors.muted}
                />
                <Row
                  label="playtime"
                  value={`${g.playtime ?? 0} min`}
                  color={colors.muted2}
                />
                <Row
                  label="favorite"
                  value={String(g.favorite)}
                  color={g.favorite ? colors.success : colors.muted}
                />
                <Row
                  label="userRating"
                  value={g.userRating != null ? String(g.userRating) : 'null'}
                  color={g.userRating != null ? colors.success : colors.muted}
                />
              </div>
            ))}
          </Section>

          {/* Botão retry */}
          <button
            onClick={runInvoke}
            disabled={invokeStatus === 'loading'}
            style={{
              width: '100%',
              padding: '6px 0',
              background: colors.btnBg,
              border: `1px solid ${colors.btnBorder}`,
              borderRadius: 4,
              color: colors.btnColor,
              cursor: invokeStatus === 'loading' ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {invokeStatus === 'loading' ? (
              <>
                <Loader2 size={11} className="animate-spin" />
                carregando...
              </>
            ) : (
              <>
                <RefreshCw size={11} />
                rodar novamente
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// === UI helpers ===

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 2,
      }}
    >
      <span style={{ color: '#888' }}>{label}</span>
      <span
        style={{
          color,
          textAlign: 'right',
          maxWidth: '65%',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
  dividerColor,
  labelColor,
}: {
  title: string;
  children: React.ReactNode;
  dividerColor: string;
  labelColor: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          color: labelColor,
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 6,
          borderBottom: `1px solid ${dividerColor}`,
          paddingBottom: 3,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Warn({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        color,
        whiteSpace: 'pre-wrap',
        lineHeight: 1.6,
        display: 'flex',
        gap: 4,
      }}
    >
      <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{children}</span>
    </div>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
