import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HumbleChoiceSection() {
  const { t } = useTranslation('subscription');

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#0B1118]">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-linear-to-br from-[#1CE8E8]/10 via-transparent to-amber-400/10" />

        {/* Premium lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-16 h-full w-px rotate-12 bg-linear-to-b from-transparent via-amber-300 to-transparent" />
          <div className="absolute top-0 left-64 h-full w-px rotate-12 bg-linear-to-b from-transparent via-cyan-300 to-transparent" />
        </div>

        <div className="relative flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex items-start gap-4">
            {/* Text */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-medium tracking-wide text-amber-200">
                  SUBSCRIPTION
                </span>
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Humble Choice
              </h3>

              <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-sm">
                {t('humble_choice_description')}
              </p>
            </div>
          </div>

          {/* Right button */}
          <div className="flex items-center">
            <a
              href="https://www.humblebundle.com/membership"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-linear-to-r from-cyan-400/10 to-amber-300/10 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-cyan-300/60 hover:from-cyan-400/20 hover:to-amber-300/20 hover:shadow-[0_0_25px_rgba(28,232,232,0.18)]"
            >
              <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              {t('humble_choice_button')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
