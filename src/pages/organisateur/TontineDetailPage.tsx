import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient }  from '@tanstack/react-query';
import { toast }     from 'react-hot-toast';
import { supabase }  from '../../lib/supabase';
import {
  RiArrowLeftLine, RiGroupLine, RiMoneyDollarCircleLine,
  RiCalendarLine, RiTrophyLine, RiShieldLine, RiLoader4Line,
  RiUserAddLine, RiShareLine, RiCheckLine, RiAlertLine,
  RiDeleteBinLine, RiFilePdfLine,
} from 'react-icons/ri';
import { useAuth }                        from '../../contexts/AuthContext';
import { useTontine }                     from '../../hooks/useTontines';
import { useInviterMembre,
         useChangerStatutMembre,
         useTontineScore }               from '../../hooks/useMembres';
import { useCotisations }                from '../../hooks/useCotisations';
import { useToursBeneficiaires }         from '../../hooks/useBeneficiaires';
import { formatMontant, formatDate,
         getStatutColor, getStatutLabel,
         getFrequenceLabel, cn }          from '../../lib/utils';
import { BoutonActiverTontine }          from '../../components/shared/BoutonActiverTontine';
import { SimulationPaiement,
         type CotisationAValider }        from '../../components/shared/SimulationPaiement';
import { BoutonInvitationExterne } from '../../components/shared/BoutonInvitationExterne';

type Onglet = 'apercu' | 'membres' | 'cotisations' | 'beneficiaires' | 'regles';

// ── Score badge ──────────────────────────────────
function ScoreBadge({ userId }: { userId: string }) {
  const { data: score = 50 } = useTontineScore(userId);
  const cls = score >= 80 ? 'bg-green-100 text-green-700'
            : score >= 60 ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700';
  return <span className={`badge ${cls} font-mono`}>{score}</span>;
}

// ── Onglet Aperçu ────────────────────────────────
function OngletApercu({ tontine }: { tontine: any }) {
  const { data: cotisations = [] } = useCotisations(tontine.id, tontine.cycle_actuel);
  const progression = tontine.total_cycles > 0
    ? Math.round((tontine.cycle_actuel / tontine.total_cycles) * 100) : 0;
  const totalCollecte = cotisations.reduce((s: number, c: any) => s + c.montant_paye, 0);
  const tauxPart      = cotisations.length > 0
    ? Math.round((cotisations.filter((c: any) => c.statut === 'payee').length / cotisations.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total collecté',    val: formatMontant(totalCollecte, tontine.devise), cls: 'text-primary-700' },
          { label: 'Taux participation',val: `${tauxPart}%`,                              cls: 'text-green-700' },
          { label: 'Membres actifs',    val: `${cotisations.length}/${tontine.nombre_membres_max}`, cls: 'text-blue-700' },
          { label: 'Pénalités cycle',   val: formatMontant(cotisations.reduce((s: number, c: any) => s + c.penalite, 0), tontine.devise), cls: 'text-red-700' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="card !p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-lg font-display font-bold mt-1 ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-display font-bold text-gray-800">Progression</h3>
          <span className="text-sm font-bold text-primary-600">{progression}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progression}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Cycle {tontine.cycle_actuel} en cours</span>
          <span>{tontine.total_cycles} cycles au total</span>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display font-bold text-gray-800 mb-4">Informations</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Type',          val: tontine.type === 'rotatif' ? 'Rotatif' : tontine.type === 'fixe' ? 'Fixe' : 'Enchères' },
            { label: 'Cotisation',    val: formatMontant(tontine.montant_cotisation, tontine.devise) },
            { label: 'Fréquence',     val: getFrequenceLabel(tontine.frequence) },
            { label: 'Date de début', val: formatDate(tontine.date_debut) },
            { label: 'Pénalité',      val: tontine.penalite_retard > 0 ? `${tontine.penalite_retard}%` : 'Aucune' },
            { label: 'Délai de grâce',val: `${tontine.delai_grace_jours} jours` },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-400">{label}</dt>
              <dd className="text-sm font-semibold text-gray-800">{val}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ── Onglet Membres ───────────────────────────────
function OngletMembres({ tontineId, tontineNom, isOrga }: { tontineId: string; tontineNom: string; isOrga: boolean }) {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const { data: membres = [], isLoading, refetch } = useQuery({
    queryKey: ['membres_complet', tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('membres_tontine')
        .select('id, user_id, role, statut, ordre_beneficiaire, a_beneficie, date_adhesion')
        .eq('tontine_id', tontineId)
        .order('date_adhesion', { ascending: true });

      if (error || !rows || rows.length === 0) return [];

      const ids = rows.map(r => r.user_id);
      const { data: profils } = await supabase
        .from('profiles')
        .select('id, nom, prenom, email')
        .in('id', ids);

      return rows.map(row => ({
        ...row,
        user: profils?.find(p => p.id === row.user_id) ?? null,
      }));
    },
  });

  const inviter       = useInviterMembre();
  const changerStatut = useChangerStatutMembre();

  const [showInvite, setShowInvite] = useState(false);
  const [email,      setEmail]      = useState('');
  const [accepting,  setAccepting]  = useState<string | null>(null);

  async function handleAccepter(membreId: string) {
    setAccepting(membreId);
    try {
      const { data, error } = await supabase
        .rpc('accepter_membre', { p_membre_id: membreId });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      toast.success('Membre accepté !');
      qc.invalidateQueries({ queryKey: ['membres_complet', tontineId] });
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de l\'acceptation');
    } finally {
      setAccepting(null);
    }
  }

  async function handleRefuser(membreId: string) {
    await changerStatut.mutateAsync({ membreId, tontineId, statut: 'exclu' });
  }

  const enAttente = membres.filter(m => m.statut === 'en_attente' || m.statut === 'invite');
  const actifs    = membres.filter(m => m.statut === 'actif');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
     {isOrga && (
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setShowInvite(s => !s)} className="btn-primary">
          <RiUserAddLine className="w-4 h-4" /> Inviter par email
        </button>
        <BoutonInvitationExterne
          tontineId={tontineId}
          tontineNom={tontineNom}
        />
      </div>
    )}
      {showInvite && (
        <div className="card animate-fade-in">
          <h3 className="font-semibold text-gray-800 mb-3">Inviter un membre</h3>
          <div className="flex gap-2">
            <input type="email" placeholder="email@exemple.com" value={email}
              onChange={e => setEmail(e.target.value)} className="input flex-1" />
            <button
              onClick={() => inviter.mutate({ tontineId, email },
                { onSuccess: () => { setEmail(''); setShowInvite(false); refetch(); } }
              )}
              disabled={inviter.isPending || !email}
              className="btn-primary"
            >
              {inviter.isPending
                ? <RiLoader4Line className="w-4 h-4 animate-spin" />
                : 'Inviter'}
            </button>
          </div>
        </div>
      )}

      {isOrga && enAttente.length > 0 && (
        <div className="card border-2 border-amber-200 bg-amber-50/50">
          <h3 className="font-semibold text-amber-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {enAttente.length}
            </span>
            Demandes en attente de validation
          </h3>
          <div className="space-y-2">
            {enAttente.map(m => {
              const nom    = m.user?.nom    ?? '—';
              const prenom = m.user?.prenom ?? '';
              return (
                <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
                  <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-700 font-bold text-sm">
                      {prenom.charAt(0)}{nom.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{prenom} {nom}</p>
                    <p className="text-xs text-gray-400">
                      {m.statut === 'invite' ? 'Invité' : 'Demande directe'} · {formatDate(m.date_adhesion)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccepter(m.id)}
                      disabled={accepting === m.id}
                      className="btn-primary btn-sm"
                    >
                      {accepting === m.id
                        ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                        : <RiCheckLine className="w-3.5 h-3.5" />}
                      Accepter
                    </button>
                    <button onClick={() => handleRefuser(m.id)} className="btn btn-danger btn-sm">
                      <RiDeleteBinLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-hidden">
        {actifs.length === 0 && enAttente.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <RiGroupLine className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Aucun membre pour le moment.</p>
          </div>
        ) : (
          <>
            {actifs.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Membres actifs ({actifs.length})
                </p>
              </div>
            )}
            {actifs.map(m => {
              const nom      = m.user?.nom     ?? '—';
              const prenom   = m.user?.prenom  ?? '';
              const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-bold text-sm">{initiales}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm truncate">{prenom} {nom}</p>
                      {m.role === 'organisateur' && <span className="badge badge-green text-xs">Organisateur</span>}
                      {m.role === 'tresorier'    && <span className="badge badge-blue text-xs">Trésorier</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.a_beneficie ? '✓ A bénéficié' : `Tour #${m.ordre_beneficiaire ?? '?'}`}
                      {' · '}Depuis {formatDate(m.date_adhesion)}
                    </p>
                  </div>
                  <span className={cn('badge hidden sm:inline-flex', getStatutColor(m.statut))}>
                    {getStatutLabel(m.statut)}
                  </span>
                  {isOrga && m.role !== 'organisateur' && (
                    <div className="flex gap-1">
                      {m.statut === 'actif' ? (
                        <button
                          onClick={() => changerStatut.mutate({ membreId: m.id, tontineId, statut: 'suspendu' })}
                          title="Suspendre"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <RiAlertLine className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => changerStatut.mutate({ membreId: m.id, tontineId, statut: 'actif' })}
                          title="Réactiver"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <RiCheckLine className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => changerStatut.mutate({ membreId: m.id, tontineId, statut: 'exclu' })}
                        title="Exclure"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <RiDeleteBinLine className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ── Onglet Cotisations ───────────────────────────
// Seule modification par rapport à l'original :
// Le bouton "Valider" ouvre SimulationPaiement au lieu d'une modal manuelle
function OngletCotisations({ tontineId, isOrga, devise, cycleActuel }: {
  tontineId:   string;
  isOrga:      boolean;
  devise:      string;
  cycleActuel: number;
}) {
  const { profile }                = useAuth();
  const qc                         = useQueryClient();
  const { data: cotisations = [] } = useCotisations(tontineId, cycleActuel);

  // Remplacement de l'état `selected` par `simulation` typé CotisationAValider
  const [simulation, setSimulation] = useState<CotisationAValider | null>(null);

  const payees   = cotisations.filter((c: any) => c.statut === 'payee').length;
  const collecte = cotisations.reduce((s: number, c: any) => s + c.montant_paye, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary-700">{payees}/{cotisations.length}</p>
          <p className="text-xs text-gray-400 mt-1">Payées</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-green-700">
            {cotisations.length > 0 ? Math.round((payees / cotisations.length) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Taux</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-lg font-display font-bold text-gray-800">{formatMontant(collecte, devise as any)}</p>
          <p className="text-xs text-gray-400 mt-1">Collecté</p>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between">
          <span className="text-sm font-semibold text-gray-700">Cycle {cycleActuel}</span>
        </div>
        {cotisations.map((c: any) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              c.statut === 'payee' ? 'bg-green-100' : c.statut === 'en_retard' ? 'bg-red-100' : 'bg-amber-100'
            )}>
              {c.statut === 'payee'
                ? <RiCheckLine className="w-4 h-4 text-green-600" />
                : c.statut === 'en_retard'
                ? <RiAlertLine className="w-4 h-4 text-red-600" />
                : <RiCalendarLine className="w-4 h-4 text-amber-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {c.user?.prenom} {c.user?.nom}
              </p>
              {c.reference && <p className="text-xs text-gray-400 font-mono mt-0.5">{c.reference}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">{formatMontant(c.montant_du, devise as any)}</p>
              {c.penalite > 0 && <p className="text-xs text-red-500">+{formatMontant(c.penalite, devise as any)}</p>}
            </div>
            <span className={cn('badge', getStatutColor(c.statut))}>{getStatutLabel(c.statut)}</span>

            {/* Bouton Valider — ouvre SimulationPaiement */}
            {isOrga && c.statut !== 'payee' && (
              <button
                onClick={() => setSimulation({
                  id:           c.id,
                  tontine_id:   tontineId,
                  membre_id:    c.membre_id,
                  user_id:      c.user_id,
                  cycle_numero: c.cycle_numero,
                  montant_du:   Number(c.montant_du),
                  penalite:     Number(c.penalite ?? 0),
                  devise,
                  user:         c.user,
                })}
                className="btn-primary btn-sm"
              >
                Valider
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal simulation paiement — isolée, n'affecte pas les autres onglets */}
      {simulation && (
        <SimulationPaiement
          cotisation={simulation}
          onClose={() => setSimulation(null)}
          onSuccess={() => {
            setSimulation(null);
            qc.invalidateQueries({ queryKey: ['cotisations', tontineId, cycleActuel] });
          }}
        />
      )}
    </div>
  );
}

// ── Onglet Bénéficiaires ─────────────────────────
function OngletBeneficiaires({ tontineId, devise }: { tontineId: string; devise: string }) {
  const { data: tours = [] } = useToursBeneficiaires(tontineId);

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-700">Calendrier des tours</p>
      </div>
      {tours.length === 0 ? (
        <div className="empty-state py-10"><p className="text-gray-400 text-sm">Aucun tour planifié.</p></div>
      ) : tours.map(t => (
        <div key={t.id} className={cn(
          'flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0',
          t.statut === 'planifie' && 'bg-violet-50'
        )}>
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
            t.statut === 'planifie' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'
          )}>
            {t.cycle_numero}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-800">
                {(t.membre as any)?.user?.prenom} {(t.membre as any)?.user?.nom}
              </p>
              {t.statut === 'planifie' && <span className="badge badge-purple text-xs">Prochain</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.date_prevue)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">{formatMontant(t.montant_total, devise as any)}</p>
            <span className={cn('badge', getStatutColor(t.statut))}>{getStatutLabel(t.statut)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Onglet Règles ────────────────────────────────
function OngletRegles({ tontine }: { tontine: any }) {
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <RiShieldLine className="w-5 h-5 text-primary-600" />
          <h3 className="font-display font-bold text-gray-800">Règlement</h3>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {tontine.regles || 'Aucun règlement défini.'}
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <RiCalendarLine className="w-3.5 h-3.5" />
          Horodaté le {formatDate(tontine.created_at)}
        </p>
      </div>
      <div className="card">
        <h3 className="font-display font-bold text-gray-800 mb-4">Paramètres financiers</h3>
        <dl className="space-y-3">
          {[
            { label: 'Pénalité',      val: tontine.penalite_retard > 0 ? `${tontine.penalite_retard}%` : 'Aucune' },
            { label: 'Délai de grâce',val: `${tontine.delai_grace_jours} jour${tontine.delai_grace_jours > 1 ? 's' : ''}` },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-400">{label}</dt>
              <dd className="text-sm font-semibold text-gray-800">{val}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────
export function TontineDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [onglet, setOnglet] = useState<Onglet>('apercu');

  const { data: tontine, isLoading } = useTontine(id);
  const isOrga = profile?.role_global === 'organisateur' || profile?.role_global === 'admin';

  const ONGLETS: { key: Onglet; label: string; icon: React.ElementType }[] = [
    { key: 'apercu',        label: 'Aperçu',       icon: RiMoneyDollarCircleLine },
    { key: 'membres',       label: 'Membres',       icon: RiGroupLine },
    { key: 'cotisations',   label: 'Cotisations',   icon: RiCalendarLine },
    { key: 'beneficiaires', label: 'Bénéficiaires', icon: RiTrophyLine },
    { key: 'regles',        label: 'Règles',        icon: RiShieldLine },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Tontine introuvable.</p>
        <Link to="/tontines" className="btn-primary mt-4 inline-flex">Retour</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/tontines" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <RiArrowLeftLine className="w-4 h-4" /> Retour aux tontines
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-display font-bold text-2xl">{tontine.nom.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display font-bold text-gray-900 text-xl">{tontine.nom}</h1>
              <span className={cn('badge', getStatutColor(tontine.statut))}>{getStatutLabel(tontine.statut)}</span>
            </div>
            {tontine.description && <p className="text-sm text-gray-500 mb-2">{tontine.description}</p>}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <RiMoneyDollarCircleLine className="w-3.5 h-3.5" />
                {formatMontant(tontine.montant_cotisation, tontine.devise)} / {getFrequenceLabel(tontine.frequence)}
              </span>
              <span className="flex items-center gap-1">
                <RiCalendarLine className="w-3.5 h-3.5" />
                Cycle {tontine.cycle_actuel}/{tontine.total_cycles}
              </span>
            </div>
          </div>
          {isOrga && (
            <div className="flex gap-2 flex-shrink-0">
              <BoutonActiverTontine
                tontineId={tontine.id}
                statut={tontine.statut}
                cycleActuel={tontine.cycle_actuel}
                totalCycles={tontine.total_cycles}
                isOrga={isOrga}
              />
              <button className="btn-outline btn-sm">
                <RiFilePdfLine className="w-4 h-4" /> Rapport
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-gray-100 p-1 rounded-xl">
        {ONGLETS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setOnglet(key)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              onglet === key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="animate-fade-in">
        {onglet === 'apercu'        && <OngletApercu tontine={tontine} />}
        {onglet === 'membres'       && <OngletMembres tontineId={tontine.id} tontineNom={tontine.nom} isOrga={isOrga} />}
        {onglet === 'cotisations'   && (
          <OngletCotisations
            tontineId={tontine.id}
            cycleActuel={tontine.cycle_actuel}
            devise={tontine.devise}
            isOrga={isOrga}
          />
        )}
        {onglet === 'beneficiaires' && <OngletBeneficiaires tontineId={tontine.id} devise={tontine.devise} />}
        {onglet === 'regles'        && <OngletRegles tontine={tontine} />}
      </div>
    </div>
  );
}