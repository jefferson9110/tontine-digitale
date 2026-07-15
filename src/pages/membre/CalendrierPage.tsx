import { useState }        from 'react';
import { useQuery }        from '@tanstack/react-query';
import { Link }            from 'react-router-dom';
import {
  RiCalendarLine, RiCalendarEventLine, RiLoader4Line,
  RiTimeLine, RiCheckDoubleLine, RiAlertLine,
  RiTrophyLine, RiMoneyDollarCircleLine, RiArrowLeftLine,
  RiArrowRightLine, RiGroupLine, RiStarFill,
} from 'react-icons/ri';
import { useAuth }         from '../../contexts/AuthContext';
import { supabase }        from '../../lib/supabase';
import { formatMontant, formatDate, cn } from '../../lib/utils';

// ════════════════════════════════════════════════
//  HOOKS
// ════════════════════════════════════════════════
function useCalendrier(userId?: string) {
  return useQuery({
    queryKey: ['calendrier', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return { cotisations: [], tours: [], tontines: [] };

      // Tontines du membre
      const { data: mt } = await supabase
        .from('membres_tontine')
        .select('tontine_id, ordre_beneficiaire, a_beneficie')
        .eq('user_id', userId)
        .in('statut', ['actif', 'en_attente']);

      if (!mt || mt.length === 0) return { cotisations: [], tours: [], tontines: [] };

      const tontineIds = mt.map(m => m.tontine_id);

      // Tontines avec infos
      const { data: tontines } = await supabase
        .from('tontines')
        .select('id, nom, montant_cotisation, devise, frequence, date_debut, cycle_actuel, total_cycles, statut')
        .in('id', tontineIds);

      // Cotisations à venir et passées
      const { data: cotisations } = await supabase
        .from('cotisations')
        .select('id, tontine_id, cycle_numero, montant_du, montant_paye, penalite, statut, date_echeance, date_paiement')
        .eq('user_id', userId)
        .order('date_echeance', { ascending: true });

      // Tours bénéficiaires
      const { data: toursRaw } = await supabase
        .from('tours_beneficiaires')
        .select('id, tontine_id, cycle_numero, montant_total, date_prevue, date_versement, statut, membre_id')
        .in('tontine_id', tontineIds)
        .order('date_prevue', { ascending: true });

      // Mon membre_id par tontine
      const { data: mesMembres } = await supabase
        .from('membres_tontine')
        .select('id, tontine_id')
        .eq('user_id', userId)
        .in('tontine_id', tontineIds);

      // Filtrer les tours qui me concernent
      const mesMembresIds = (mesMembres ?? []).map(m => m.id);
      const monTour       = (toursRaw ?? []).filter(t => mesMembresIds.includes(t.membre_id));

      return {
        cotisations: cotisations ?? [],
        tours:       monTour,
        tontines:    tontines ?? [],
        mt:          mt,
      };
    },
  });
}

// ════════════════════════════════════════════════
//  COMPOSANTS
// ════════════════════════════════════════════════

// ── Carte événement calendrier ───────────────────
function EventCard({ date, titre, sous_titre, montant, devise, statut, isMon, isToday }: {
  date:      string;
  titre:     string;
  sous_titre:string;
  montant:   number;
  devise:    string;
  statut:    string;
  isMon?:    boolean;
  isToday?:  boolean;
}) {
  const d     = new Date(date);
  const jour  = d.toLocaleDateString('fr-FR', { weekday: 'short' });
  const num   = d.getDate();
  const mois  = d.toLocaleDateString('fr-FR', { month: 'short' });

  const { bgDate, textDate, bgCard, border } =
    statut === 'payee' || statut === 'verse'
      ? { bgDate: 'bg-green-500', textDate: 'text-white', bgCard: '', border: 'border-green-100 dark:border-green-500/20' }
    : statut === 'en_retard'
      ? { bgDate: 'bg-red-500',   textDate: 'text-white', bgCard: 'bg-red-50/50 dark:bg-red-500/5', border: 'border-red-200 dark:border-red-500/20' }
    : isMon
      ? { bgDate: 'bg-amber-500', textDate: 'text-white', bgCard: 'bg-amber-50/50 dark:bg-amber-500/5', border: 'border-amber-300 dark:border-amber-500/30' }
    : isToday
      ? { bgDate: 'bg-primary-600', textDate: 'text-white', bgCard: 'bg-primary-50/50 dark:bg-primary-500/5', border: 'border-primary-200 dark:border-primary-500/20' }
    : { bgDate: 'bg-gray-100 dark:bg-slate-700', textDate: 'text-gray-600 dark:text-slate-300', bgCard: '', border: 'border-gray-100 dark:border-slate-700' };

  return (
    <div className={cn('flex items-center gap-4 p-4 rounded-2xl border-2 transition-all', bgCard, border)}>
      {/* Date */}
      <div className={cn('w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0', bgDate)}>
        <span className={cn('text-[10px] font-semibold uppercase', textDate)}>{jour}</span>
        <span className={cn('text-xl font-display font-black leading-none', textDate)}>{num}</span>
        <span className={cn('text-[10px] font-semibold uppercase', textDate)}>{mois}</span>
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{titre}</p>
          {isMon && (
            <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
              <RiStarFill className="w-3 h-3" /> Mon tour
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sous_titre}</p>
      </div>

      {/* Montant + statut */}
      <div className="text-right flex-shrink-0">
        <p className="font-display font-bold text-gray-900 dark:text-slate-100 text-sm">
          {formatMontant(montant, devise as any)}
        </p>
        <span className={cn('text-xs font-semibold',
          statut === 'payee' || statut === 'verse' ? 'text-green-600 dark:text-green-400' :
          statut === 'en_retard' ? 'text-red-600 dark:text-red-400' :
          isMon ? 'text-amber-600 dark:text-amber-400' :
          'text-gray-400 dark:text-slate-500'
        )}>
          {statut === 'payee' ? '✓ Payée'
          : statut === 'verse' ? '✓ Versé'
          : statut === 'en_retard' ? '⚠ En retard'
          : statut === 'planifie' && isMon ? '🏆 À percevoir'
          : statut === 'planifie' ? 'Planifié'
          : 'En attente'}
        </span>
      </div>
    </div>
  );
}

// ── Vue mois ─────────────────────────────────────
function VueMois({ annee, mois, evenements, onPrev, onNext }: {
  annee:      number;
  mois:       number;
  evenements: any[];
  onPrev:     () => void;
  onNext:     () => void;
}) {
  const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const maintenant = new Date();

  // Premier jour du mois (lundi = 0)
  const premier = new Date(annee, mois, 1);
  const offset  = (premier.getDay() + 6) % 7;
  const nbJours = new Date(annee, mois + 1, 0).getDate();

  const nomMois = new Date(annee, mois).toLocaleDateString('fr-FR', {
    month: 'long', year: 'numeric',
  });

  // Jours avec événements
  const joursAvecEvts: Record<number, any[]> = {};
  evenements.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === annee && d.getMonth() === mois) {
      const j = d.getDate();
      if (!joursAvecEvts[j]) joursAvecEvts[j] = [];
      joursAvecEvts[j].push(e);
    }
  });

  const cellules: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: nbJours }, (_, i) => i + 1),
  ];
  // Compléter à 42 cases
  while (cellules.length < 42) cellules.push(null);

  return (
    <div className="card">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <RiArrowLeftLine className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </button>
        <h3 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base capitalize">
          {nomMois}
        </h3>
        <button onClick={onNext}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <RiArrowRightLine className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Jours semaine */}
      <div className="grid grid-cols-7 mb-2">
        {JOURS.map(j => (
          <div key={j} className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 py-1">
            {j}
          </div>
        ))}
      </div>

      {/* Grille jours */}
      <div className="grid grid-cols-7 gap-1">
        {cellules.map((jour, i) => {
          if (!jour) return <div key={i} />;

          const evts      = joursAvecEvts[jour] ?? [];
          const isToday   = maintenant.getFullYear() === annee &&
                            maintenant.getMonth() === mois &&
                            maintenant.getDate() === jour;
          const hasCotis  = evts.some(e => e.type === 'cotisation');
          const hasTour   = evts.some(e => e.type === 'tour' && e.isMon);
          const hasRetard = evts.some(e => e.statut === 'en_retard');

          return (
            <div key={i} className={cn(
              'aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium relative transition-all cursor-default',
              isToday   ? 'bg-primary-600 text-white font-bold ring-2 ring-primary-300' :
              hasTour   ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold' :
              hasCotis  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400' :
              'text-gray-700 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
            )}>
              {jour}
              {/* Indicateurs */}
              <div className="flex gap-0.5 mt-0.5">
                {hasCotis && !isToday && (
                  <span className={cn('w-1.5 h-1.5 rounded-full',
                    hasRetard ? 'bg-red-500' : 'bg-primary-500'
                  )} />
                )}
                {hasTour && !isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
        {[
          { dot: 'bg-primary-500', label: 'Cotisation' },
          { dot: 'bg-amber-500',   label: 'Mon tour' },
          { dot: 'bg-red-500',     label: 'En retard' },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-full', dot)} />
            <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ════════════════════════════════════════════════
export function CalendrierPage() {
  const { profile }                                    = useAuth();
  const { data, isLoading }                            = useCalendrier(profile?.id);
  const maintenant                                     = new Date();
  const [annee, setAnnee]                              = useState(maintenant.getFullYear());
  const [mois,  setMois]                               = useState(maintenant.getMonth());
  const [vue,   setVue]                                = useState<'liste' | 'mois'>('liste');
  const [filtre, setFiltre]                            = useState<'tous' | 'cotisations' | 'tours'>('tous');

  const cotisations  = data?.cotisations ?? [];
  const tours        = data?.tours       ?? [];
  const tontines     = data?.tontines    ?? [];

  // Construire la liste d'événements unifiée
  const evenements = [
    ...cotisations.map(c => ({
      id:         c.id,
      type:       'cotisation',
      date:       c.date_echeance,
      titre:      `Cotisation — ${tontines.find(t => t.id === c.tontine_id)?.nom ?? ''}`,
      sous_titre: `Cycle ${c.cycle_numero}`,
      montant:    Number(c.montant_du) + Number(c.penalite ?? 0),
      devise:     tontines.find(t => t.id === c.tontine_id)?.devise ?? 'XAF',
      statut:     c.statut,
      isMon:      false,
    })),
    ...tours.map(t => ({
      id:         t.id,
      type:       'tour',
      date:       t.date_prevue ?? t.date_versement,
      titre:      `Tour bénéficiaire — ${tontines.find(ton => ton.id === t.tontine_id)?.nom ?? ''}`,
      sous_titre: `Cycle ${t.cycle_numero} — Vous recevez la cagnotte`,
      montant:    Number(t.montant_total),
      devise:     tontines.find(ton => ton.id === t.tontine_id)?.devise ?? 'XAF',
      statut:     t.statut,
      isMon:      true,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filtrage
  const evtsFiltres = evenements.filter(e =>
    filtre === 'tous'        ? true :
    filtre === 'cotisations' ? e.type === 'cotisation' :
    filtre === 'tours'       ? e.type === 'tour' : true
  );

  // Prochains événements (à partir d'aujourd'hui)
  const prochains = evtsFiltres.filter(e => new Date(e.date) >= maintenant);
  const passes    = evtsFiltres.filter(e => new Date(e.date) < maintenant).reverse();

  // Mon prochain tour
  const monProchainTour = tours.find(t =>
    t.statut === 'planifie' && new Date(t.date_prevue) >= maintenant
  );

  function prevMois() {
    if (mois === 0) { setMois(11); setAnnee(a => a - 1); }
    else setMois(m => m - 1);
  }
  function nextMois() {
    if (mois === 11) { setMois(0); setAnnee(a => a + 1); }
    else setMois(m => m + 1);
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiCalendarEventLine className="w-6 h-6 text-primary-600" />
          Calendrier prévisionnel
        </h1>
        <p className="page-subtitle">
          Vos cotisations à venir et vos tours bénéficiaires
        </p>
      </div>

      {/* Mon prochain tour — bannière prioritaire */}
      {monProchainTour && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <RiTrophyLine className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-amber-100 text-xs font-semibold uppercase tracking-wide mb-1">
              🏆 Votre prochain tour bénéficiaire
            </p>
            <p className="text-white font-display font-bold text-xl">
              {formatMontant(monProchainTour.montant_total, tontines.find(t => t.id === monProchainTour.tontine_id)?.devise ?? 'XAF' as any)}
            </p>
            <p className="text-amber-200 text-sm mt-0.5">
              {tontines.find(t => t.id === monProchainTour.tontine_id)?.nom} ·{' '}
              Cycle {monProchainTour.cycle_numero} ·{' '}
              {formatDate(monProchainTour.date_prevue)}
            </p>
          </div>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary-700 dark:text-primary-400">
            {prochains.filter(e => e.type === 'cotisation').length}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Cotisations à venir</p>
        </div>
        <div className="card !p-4 text-center">
          <p className={cn('text-2xl font-display font-bold',
            evtsFiltres.filter(e => e.statut === 'en_retard').length > 0
              ? 'text-red-600 dark:text-red-400' : 'text-gray-300 dark:text-slate-600'
          )}>
            {evtsFiltres.filter(e => e.statut === 'en_retard').length}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">En retard</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400">
            {tours.filter(t => t.statut === 'planifie').length}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Tours prévus</p>
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Filtres */}
        <div className="flex gap-2">
          {[
            { key: 'tous',        label: 'Tous' },
            { key: 'cotisations', label: 'Cotisations' },
            { key: 'tours',       label: 'Mes tours' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltre(key as any)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                filtre === key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600'
              )}>{label}</button>
          ))}
        </div>

        {/* Toggle vue */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { key: 'liste', icon: RiCalendarLine,      label: 'Liste' },
            { key: 'mois',  icon: RiCalendarEventLine, label: 'Mois' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setVue(key as any)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                vue === key
                  ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400'
              )}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Pas de tontines */}
      {tontines.length === 0 && (
        <div className="card text-center py-12">
          <RiCalendarEventLine className="w-12 h-12 text-gray-200 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-500 dark:text-slate-400">
            Aucune tontine active
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-4">
            Rejoignez ou créez une tontine pour voir votre calendrier.
          </p>
          <Link to="/tontines" className="btn-primary inline-flex">
            Voir les tontines <RiArrowRightLine className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Vue Mois */}
      {vue === 'mois' && tontines.length > 0 && (
        <VueMois
          annee={annee} mois={mois}
          evenements={evtsFiltres}
          onPrev={prevMois} onNext={nextMois}
        />
      )}

      {/* Vue Liste */}
      {vue === 'liste' && tontines.length > 0 && (
        <div className="space-y-5">
          {/* À venir */}
          {prochains.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base mb-3 flex items-center gap-2">
                <RiTimeLine className="w-5 h-5 text-primary-600" />
                À venir ({prochains.length})
              </h2>
              <div className="space-y-3">
                {prochains.map(e => (
                  <EventCard key={`${e.type}-${e.id}`}
                    date={e.date} titre={e.titre} sous_titre={e.sous_titre}
                    montant={e.montant} devise={e.devise} statut={e.statut}
                    isMon={e.isMon}
                    isToday={new Date(e.date).toDateString() === maintenant.toDateString()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Aucun événement à venir */}
          {prochains.length === 0 && evenements.length > 0 && (
            <div className="card text-center py-8">
              <RiCheckDoubleLine className="w-10 h-10 text-green-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-slate-400 font-medium">
                Aucun événement à venir
              </p>
            </div>
          )}

          {/* Passés */}
          {passes.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-gray-700 dark:text-slate-400 text-sm mb-3 flex items-center gap-2">
                <RiCheckDoubleLine className="w-4 h-4 text-gray-400" />
                Historique ({passes.length})
              </h2>
              <div className="space-y-2 opacity-70">
                {passes.slice(0, 10).map(e => (
                  <EventCard key={`${e.type}-${e.id}`}
                    date={e.date} titre={e.titre} sous_titre={e.sous_titre}
                    montant={e.montant} devise={e.devise} statut={e.statut}
                    isMon={e.isMon}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}