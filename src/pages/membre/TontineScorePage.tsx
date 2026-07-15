import { useState }        from 'react';
import { Link }            from 'react-router-dom';
import { useQuery }        from '@tanstack/react-query';
import {
  RiStarFill, RiStarLine, RiCheckDoubleLine, RiAlertLine,
  RiTimeLine, RiGroupLine, RiArrowRightLine, RiInformationLine,
  RiTrophyLine, RiShieldCheckLine, RiLoader4Line,
  RiMoneyDollarCircleLine, RiMedalLine, RiBarChartLine,
  RiArrowUpLine, RiArrowDownLine,
} from 'react-icons/ri';
import { useAuth }         from '../../contexts/AuthContext';
import { supabase }        from '../../lib/supabase';
import { formatMontant, cn } from '../../lib/utils';

// ════════════════════════════════════════════════
//  HOOKS
// ════════════════════════════════════════════════
function useMonScore(userId?: string) {
  return useQuery({
    queryKey: ['tontine_score_v2', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('cotisations')
        .select('statut, montant_du, montant_paye, penalite, tontine_id, created_at')
        .eq('user_id', userId);

      if (error || !data) return null;

      const total     = data.length;
      const payees    = data.filter(c => c.statut === 'payee').length;
      const retards   = data.filter(c => c.statut === 'en_retard').length;
      const partielles = data.filter(c => c.statut === 'partiellement_payee').length;
      const penalites = data.reduce((s, c) => s + Number(c.penalite), 0);
      const totalDu   = data.reduce((s, c) => s + Number(c.montant_du), 0);
      const tontinesIds = [...new Set(data.map(c => c.tontine_id))];

      // Calcul du score
      const scorePaiement  = total > 0 ? (payees / total) * 60 : 30;
      const scoreCycles    = Math.min(total * 1.5, 20);
      const scoreMulti     = Math.min((tontinesIds.length - 1) * 5, 10);
      const malusRetards   = Math.min(retards * 5, 20);
      const malusPenalites = totalDu > 0 ? Math.min((penalites / totalDu) * 100, 10) : 0;

      const score = Math.max(0, Math.min(100,
        Math.round(scorePaiement + scoreCycles + scoreMulti - malusRetards - malusPenalites)
      ));

      const niveau = total === 0 ? 'Nouveau'
        : score >= 85 ? 'Excellent'
        : score >= 70 ? 'Fiable'
        : score >= 50 ? 'Correct'
        : 'Faible';

      return {
        score, niveau, total, payees, retards, partielles,
        penalites, totalDu, tontinesIds,
        details: {
          scorePaiement:  Math.round(scorePaiement),
          scoreCycles:    Math.round(scoreCycles),
          scoreMulti:     Math.round(scoreMulti),
          malusRetards:   Math.round(malusRetards),
          malusPenalites: Math.round(malusPenalites),
        },
      };
    },
  });
}

function useScoresMembres(tontineId?: string) {
  return useQuery({
    queryKey: ['scores_membres', tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data: membres } = await supabase
        .from('membres_tontine')
        .select('user_id, statut')
        .eq('tontine_id', tontineId!)
        .eq('statut', 'actif');

      if (!membres || membres.length === 0) return [];

      const ids = membres.map(m => m.user_id);
      const { data: profils } = await supabase
        .from('profiles').select('id, nom, prenom').in('id', ids);

      const { data: cotisations } = await supabase
        .from('cotisations')
        .select('user_id, statut, montant_du, penalite, tontine_id')
        .eq('tontine_id', tontineId!)
        .in('user_id', ids);

      return ids.map(uid => {
        const cots    = (cotisations ?? []).filter(c => c.user_id === uid);
        const total   = cots.length;
        const payees  = cots.filter(c => c.statut === 'payee').length;
        const retards = cots.filter(c => c.statut === 'en_retard').length;
        const score   = Math.max(0, Math.min(100,
          Math.round(
            (total > 0 ? (payees / total) * 60 : 30)
            + Math.min(total * 1.5, 20)
            - Math.min(retards * 5, 20)
          )
        ));
        return {
          user_id: uid,
          profil: profils?.find(p => p.id === uid),
          score,
          niveau: score >= 85 ? 'Excellent' : score >= 70 ? 'Fiable'
               : score >= 50 ? 'Correct'   : total === 0 ? 'Nouveau' : 'Faible',
          payees, retards, total,
        };
      }).sort((a, b) => b.score - a.score);
    },
  });
}

function useMesTontines(userId?: string) {
  return useQuery({
    queryKey: ['mes_tontines_score', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: mt } = await supabase
        .from('membres_tontine')
        .select('tontine_id')
        .eq('user_id', userId!)
        .eq('statut', 'actif');
      if (!mt || mt.length === 0) return [];
      const ids = mt.map(m => m.tontine_id);
      const { data } = await supabase
        .from('tontines')
        .select('id, nom, statut')
        .in('id', ids)
        .eq('statut', 'active');
      return data ?? [];
    },
  });
}

// ════════════════════════════════════════════════
//  COMPOSANTS
// ════════════════════════════════════════════════

// ── Jauge SVG animée ─────────────────────────────
function ScoreGauge({ score, niveau }: { score: number; niveau: string }) {
  const radius  = 70;
  const cx      = 90;
  const cy      = 90;
  const circumf = 2 * Math.PI * radius;
  const dash    = (score / 100) * circumf;

  const { couleur, bg, label } = score >= 85
    ? { couleur: '#16a34a', bg: 'bg-green-50',   label: 'Excellent' }
    : score >= 70
    ? { couleur: '#2563eb', bg: 'bg-blue-50',    label: 'Fiable' }
    : score >= 50
    ? { couleur: '#d97706', bg: 'bg-amber-50',   label: 'Correct' }
    : { couleur: '#dc2626', bg: 'bg-red-50',     label: niveau === 'Nouveau' ? 'Nouveau' : 'Faible' };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* Fond gris */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke="#f1f5f9" strokeWidth="14" />
          {/* Arc coloré */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke={couleur} strokeWidth="14"
            strokeDasharray={`${dash} ${circumf - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
          {/* Score central */}
          <text x={cx} y={cy - 8} textAnchor="middle"
            fontSize="36" fontWeight="800" fill={couleur} fontFamily="system-ui">
            {score}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle"
            fontSize="13" fill="#94a3b8" fontFamily="system-ui">
            / 100
          </text>
        </svg>

        {/* Étoile déco */}
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: couleur }}>
          <RiStarFill className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Badge niveau */}
      <div className={cn('px-5 py-1.5 rounded-full font-bold text-sm', bg)}
        style={{ color: couleur }}>
        {label}
      </div>
    </div>
  );
}

// ── Barre de critère ─────────────────────────────
function BarreCritere({ label, valeur, max, couleur, icone: Icon, info }: {
  label:   string;
  valeur:  number;
  max:     number;
  couleur: string;
  icone:   React.ElementType;
  info:    string;
}) {
  const pct = Math.round((Math.abs(valeur) / max) * 100);
  const positif = valeur >= 0;

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
        positif ? 'bg-green-50' : 'bg-red-50'
      )}>
        <Icon className={cn('w-4 h-4', positif ? 'text-green-600' : 'text-red-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</p>
          <div className="flex items-center gap-1">
            {positif
              ? <RiArrowUpLine className="w-3.5 h-3.5 text-green-500" />
              : <RiArrowDownLine className="w-3.5 h-3.5 text-red-500" />}
            <span className={cn('text-sm font-bold',
              positif ? 'text-green-600' : 'text-red-600'
            )}>
              {positif ? '+' : ''}{valeur} pts
            </span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: couleur }} />
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{info}</p>
      </div>
    </div>
  );
}

// ── Carte membre classement ──────────────────────
function MembreScoreCard({ m, rank }: { m: any; rank: number }) {
  const { couleur, bg } = m.score >= 85
    ? { couleur: 'text-green-600', bg: 'bg-green-100' }
    : m.score >= 70
    ? { couleur: 'text-blue-600',  bg: 'bg-blue-100' }
    : m.score >= 50
    ? { couleur: 'text-amber-600', bg: 'bg-amber-100' }
    : { couleur: 'text-red-600',   bg: 'bg-red-100' };

  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-slate-700/50 last:border-0',
      rank === 1 && 'bg-amber-50/50 dark:bg-amber-500/5'
    )}>
      {/* Rang */}
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        {rankEmoji
          ? <span className="text-xl">{rankEmoji}</span>
          : <span className="text-sm font-bold text-gray-400">#{rank}</span>}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-primary-700 dark:text-primary-400 font-bold text-sm">
          {m.profil?.prenom?.charAt(0)}{m.profil?.nom?.charAt(0)}
        </span>
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm truncate">
          {m.profil?.prenom} {m.profil?.nom}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500">
          {m.payees}/{m.total} payées · {m.retards} retard{m.retards > 1 ? 's' : ''}
        </p>
      </div>

      {/* Score */}
      <div className="flex flex-col items-end flex-shrink-0">
        <div className={cn('px-3 py-1 rounded-full font-bold font-mono text-sm', bg, couleur)}>
          {m.score}
        </div>
        <p className={cn('text-xs mt-0.5', couleur)}>{m.niveau}</p>
      </div>

      {/* Mini barre */}
      <div className="w-12 flex-shrink-0">
        <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full"
            style={{
              width: `${m.score}%`,
              backgroundColor: m.score >= 85 ? '#16a34a' : m.score >= 70 ? '#2563eb'
                             : m.score >= 50 ? '#d97706' : '#dc2626',
            }} />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ════════════════════════════════════════════════
export function TontineScorePage() {
  const { profile }                              = useAuth();
  const { data: scoreData, isLoading }           = useMonScore(profile?.id);
  const { data: tontines = [] }                  = useMesTontines(profile?.id);
  const [tontineSelectee, setTontineSelectee]    = useState<string>('');
  const { data: classement = [], isLoading: loadingClass } = useScoresMembres(
    tontineSelectee || tontines[0]?.id
  );
  const [onglet, setOnglet] = useState<'score' | 'classement' | 'algorithme'>('score');

  const score  = scoreData?.score   ?? 50;
  const niveau = scoreData?.niveau  ?? 'Nouveau';

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* En-tête */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiStarFill className="w-6 h-6 text-amber-500" />
          TontineScore
        </h1>
        <p className="page-subtitle">Votre score de fiabilité financière</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
        {[
          { key: 'score',      label: 'Mon score',     icon: RiStarLine },
          { key: 'classement', label: 'Classement',    icon: RiTrophyLine },
          { key: 'algorithme', label: 'Algorithme',    icon: RiBarChartLine },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setOnglet(key as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
              onglet === key
                ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            )}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Onglet : Mon score ── */}
      {onglet === 'score' && (
        <div className="space-y-5 animate-fade-in">
          {/* Card principale */}
          <div className="card">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreGauge score={score} niveau={niveau} />

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="font-display font-bold text-gray-900 dark:text-slate-100 text-xl">
                    {score}/100 — {niveau}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {score >= 85 ? '🏆 Excellent historique ! Les organisateurs vous font pleinement confiance.'
                    : score >= 70 ? '✅ Bon profil. Continuez à payer à temps pour atteindre Excellent.'
                    : score >= 50 ? '⚠️ Profil correct. Réduisez vos retards pour progresser.'
                    : scoreData?.total === 0 ? '👋 Bienvenue ! Votre score sera calculé après vos premières cotisations.'
                    : '🔴 Score à améliorer. Payez avant les échéances.'}
                  </p>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Payées',   val: scoreData?.payees ?? 0,   cls: 'text-green-700 dark:text-green-400' },
                    { label: 'Retards',  val: scoreData?.retards ?? 0,  cls: scoreData?.retards ? 'text-red-600 dark:text-red-400' : 'text-gray-400' },
                    { label: 'Tontines', val: scoreData?.tontinesIds.length ?? 0, cls: 'text-primary-700 dark:text-primary-400' },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="text-center bg-gray-50 dark:bg-slate-700/50 rounded-xl py-3">
                      <p className={cn('text-2xl font-display font-bold', cls)}>{val}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Détail des critères */}
          {scoreData && scoreData.total > 0 && (
            <div className="card space-y-4">
              <h3 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base">
                Détail par critère
              </h3>
              <BarreCritere
                label="Taux de paiement"
                valeur={scoreData.details.scorePaiement}
                max={60} couleur="#16a34a"
                icone={RiCheckDoubleLine}
                info={`${scoreData.payees} sur ${scoreData.total} cotisations payées à temps`}
              />
              <BarreCritere
                label="Cycles honorés"
                valeur={scoreData.details.scoreCycles}
                max={20} couleur="#2563eb"
                icone={RiTimeLine}
                info={`${scoreData.total} cycle${scoreData.total > 1 ? 's' : ''} complété${scoreData.total > 1 ? 's' : ''}`}
              />
              <BarreCritere
                label="Multi-tontines"
                valeur={scoreData.details.scoreMulti}
                max={10} couleur="#7c3aed"
                icone={RiGroupLine}
                info={`${scoreData.tontinesIds.length} tontine${scoreData.tontinesIds.length > 1 ? 's' : ''} participée${scoreData.tontinesIds.length > 1 ? 's' : ''}`}
              />
              {scoreData.retards > 0 && (
                <BarreCritere
                  label="Pénalité retards"
                  valeur={-scoreData.details.malusRetards}
                  max={20} couleur="#dc2626"
                  icone={RiAlertLine}
                  info={`${scoreData.retards} retard${scoreData.retards > 1 ? 's' : ''} (-5 pts chacun)`}
                />
              )}
              {scoreData.details.malusPenalites > 0 && (
                <BarreCritere
                  label="Pénalités financières"
                  valeur={-scoreData.details.malusPenalites}
                  max={10} couleur="#dc2626"
                  icone={RiMoneyDollarCircleLine}
                  info={`${formatMontant(scoreData.penalites)} de pénalités accumulées`}
                />
              )}
            </div>
          )}

          {/* Conseils */}
          {score < 85 && scoreData && scoreData.total > 0 && (
            <div className="card">
              <h3 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base mb-4">
                Comment améliorer votre score
              </h3>
              <div className="space-y-3">
                {scoreData.retards > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                    <RiTimeLine className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Réduisez vos retards
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Activez les notifications pour être prévenu 3 jours avant chaque échéance.
                      </p>
                    </div>
                  </div>
                )}
                {scoreData.tontinesIds.length < 2 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                    <RiGroupLine className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        Rejoignez une 2ème tontine
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        +5 pts par tontine supplémentaire (max +10 pts).
                      </p>
                    </div>
                  </div>
                )}
                {scoreData.total < 6 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                    <RiCheckDoubleLine className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                        Continuez à cotiser
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        +1.5 pt par cycle honoré (max +20 pts).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pas encore de données */}
          {scoreData?.total === 0 && (
            <div className="card text-center py-10">
              <RiShieldCheckLine className="w-12 h-12 text-gray-200 dark:text-slate-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 dark:text-slate-400">
                Pas encore de données
              </p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-4">
                Votre score sera calculé dès votre première cotisation.
              </p>
              <Link to="/tontines" className="btn-primary inline-flex">
                Voir les tontines <RiArrowRightLine className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet : Classement ── */}
      {onglet === 'classement' && (
        <div className="space-y-4 animate-fade-in">
          {tontines.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-400 dark:text-slate-500 text-sm">
                Rejoignez une tontine pour voir les classements.
              </p>
            </div>
          ) : (
            <>
              {/* Sélecteur tontine */}
              {tontines.length > 1 && (
                <div>
                  <label className="label">Tontine</label>
                  <select
                    value={tontineSelectee || tontines[0]?.id}
                    onChange={e => setTontineSelectee(e.target.value)}
                    className="input"
                  >
                    {tontines.map(t => (
                      <option key={t.id} value={t.id}>{t.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Podium top 3 */}
              {classement.length >= 3 && (
                <div className="card">
                  <h3 className="font-display font-bold text-gray-900 dark:text-slate-100 text-sm mb-4 text-center">
                    🏆 Podium
                  </h3>
                  <div className="flex items-end justify-center gap-3">
                    {/* 2ème */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 dark:text-slate-300 font-bold text-sm">
                          {classement[1]?.profil?.prenom?.charAt(0)}{classement[1]?.profil?.nom?.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-center text-gray-600 dark:text-slate-400 font-medium truncate max-w-[60px]">
                        {classement[1]?.profil?.prenom}
                      </span>
                      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-t-lg flex items-end justify-center pb-1">
                        <span className="text-2xl">🥈</span>
                      </div>
                      <span className="badge bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-mono">
                        {classement[1]?.score}
                      </span>
                    </div>
                    {/* 1er */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                          {classement[0]?.profil?.prenom?.charAt(0)}{classement[0]?.profil?.nom?.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-center text-gray-800 dark:text-slate-200 font-bold truncate max-w-[60px]">
                        {classement[0]?.profil?.prenom}
                      </span>
                      <div className="w-16 h-24 bg-amber-100 dark:bg-amber-500/20 rounded-t-lg flex items-end justify-center pb-1">
                        <span className="text-2xl">🥇</span>
                      </div>
                      <span className="badge bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono">
                        {classement[0]?.score}
                      </span>
                    </div>
                    {/* 3ème */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-orange-700 dark:text-orange-400 font-bold text-sm">
                          {classement[2]?.profil?.prenom?.charAt(0)}{classement[2]?.profil?.nom?.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-center text-gray-600 dark:text-slate-400 font-medium truncate max-w-[60px]">
                        {classement[2]?.profil?.prenom}
                      </span>
                      <div className="w-16 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-t-lg flex items-end justify-center pb-1">
                        <span className="text-2xl">🥉</span>
                      </div>
                      <span className="badge bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 font-mono">
                        {classement[2]?.score}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste complète */}
              <div className="card !p-0 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Classement complet — {classement.length} membres
                  </p>
                </div>
                {loadingClass ? (
                  <div className="flex items-center justify-center h-24">
                    <RiLoader4Line className="w-6 h-6 text-primary-500 animate-spin" />
                  </div>
                ) : classement.map((m, i) => (
                  <MembreScoreCard key={m.user_id} m={m} rank={i + 1} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Onglet : Algorithme ── */}
      {onglet === 'algorithme' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <RiInformationLine className="w-5 h-5 text-primary-600" />
              <h3 className="font-display font-bold text-gray-900 dark:text-slate-100">
                Comment est calculé le TontineScore ?
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5 leading-relaxed">
              Le TontineScore est un indicateur de fiabilité financière calculé automatiquement
              à partir de votre historique de cotisations sur la plateforme.
            </p>

            <div className="space-y-3">
              {[
                { label: 'Taux de paiement à temps', pts: '+60 pts max', desc: '(cotisations payées ÷ total) × 60', couleur: 'bg-green-500', positif: true },
                { label: 'Cycles honorés',           pts: '+20 pts max', desc: '1.5 pt par cycle, plafonné à 20',   couleur: 'bg-blue-500',  positif: true },
                { label: 'Multi-tontines',            pts: '+10 pts max', desc: '+5 pts par tontine supplémentaire', couleur: 'bg-violet-500', positif: true },
                { label: 'Malus retards',             pts: '-20 pts max', desc: '-5 pts par retard de paiement',    couleur: 'bg-red-500',   positif: false },
                { label: 'Malus pénalités',           pts: '-10 pts max', desc: 'Proportionnel aux pénalités reçues', couleur: 'bg-orange-500', positif: false },
              ].map(({ label, pts, desc, couleur, positif }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div className={cn('w-3 h-3 rounded-full mt-1 flex-shrink-0', couleur)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{label}</p>
                      <span className={cn('text-sm font-bold',
                        positif ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>{pts}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Niveaux */}
          <div className="card">
            <h3 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base mb-4">
              Niveaux de fiabilité
            </h3>
            <div className="space-y-2">
              {[
                { range: '85 – 100', niveau: 'Excellent',  couleur: 'bg-green-500',  desc: 'Fiabilité maximale. Prioritaire pour rejoindre de nouvelles tontines.' },
                { range: '70 – 84',  niveau: 'Fiable',     couleur: 'bg-blue-500',   desc: 'Bon historique. Les organisateurs vous acceptent avec confiance.' },
                { range: '50 – 69',  niveau: 'Correct',    couleur: 'bg-amber-500',  desc: 'Quelques retards. Améliorable avec plus de régularité.' },
                { range: '0 – 49',   niveau: 'Faible',     couleur: 'bg-red-500',    desc: 'Historique insuffisant. Payez à temps pour progresser rapidement.' },
                { range: '—',        niveau: 'Nouveau',    couleur: 'bg-gray-400',   desc: 'Aucune cotisation enregistrée. Score de départ neutre : 50.' },
              ].map(({ range, niveau, couleur, desc }) => (
                <div key={niveau} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className={cn('w-12 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', couleur)}>
                    <span className="text-white text-xs font-bold">{range.split(' ')[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{niveau}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}