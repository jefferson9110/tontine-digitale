import { useState } from 'react';
import {
  RiBellLine, RiCheckDoubleLine, RiMoneyDollarCircleLine,
  RiGroupLine, RiAlertLine, RiCalendarLine, RiSettings3Line,
  RiDeleteBinLine, RiFilterLine, RiInboxLine, RiCircleFill,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, cn } from '../../lib/utils';
import type { Notification, NotificationTypes } from '../../types';

// ── Mock data ────────────────────────────────────
const MOCK_NOTIFS: Notification[] = [
  { id: '1', user_id: 'me', type: 'rappel_paiement',     titre: 'Cotisation à payer',              message: 'Votre cotisation de 25 000 FCFA pour Njangi Fonctionnaires est due dans 3 jours (10 juillet).', lu: false, created_at: '2026-07-07T08:00:00' },
  { id: '2', user_id: 'me', type: 'beneficiaire_annonce', titre: 'Votre tour approche !',            message: 'Vous êtes le bénéficiaire du cycle 9 de Njangi Fonctionnaires. Versement prévu le 31 août.', lu: false, created_at: '2026-07-06T14:00:00' },
  { id: '3', user_id: 'me', type: 'paiement_recu',        titre: 'Cotisation validée',               message: 'Votre cotisation du cycle 7 (25 000 FCFA) a été validée par Marcelline T. Référence : MTN-20260601.', lu: false, created_at: '2026-07-05T10:30:00' },
  { id: '4', user_id: 'me', type: 'nouveau_membre',       titre: 'Nouveau membre',                   message: 'Jean-Paul Mballa a rejoint la tontine Njangi Fonctionnaires Yaoundé.', lu: true, created_at: '2026-07-04T09:00:00' },
  { id: '5', user_id: 'me', type: 'cycle_ouvert',         titre: 'Cycle 8 ouvert',                   message: 'Le cycle 8 de Njangi Fonctionnaires est maintenant ouvert. Cotisation due avant le 10 juillet.', lu: true, created_at: '2026-07-01T08:00:00' },
  { id: '6', user_id: 'me', type: 'penalite_appliquee',   titre: 'Pénalité appliquée',               message: 'Une pénalité de 1 250 FCFA a été appliquée à Solange K. pour retard de paiement (cycle 8).', lu: true, created_at: '2026-07-03T12:00:00' },
  { id: '7', user_id: 'me', type: 'invitation_tontine',   titre: 'Invitation à rejoindre',           message: 'Cécile Atanga vous invite à rejoindre la tontine "Épargne Femmes Actives". Cliquez pour accepter.', lu: true, created_at: '2026-06-30T16:00:00' },
  { id: '8', user_id: 'me', type: 'cycle_ferme',          titre: 'Cycle 7 clôturé',                  message: 'Le cycle 7 de Tontine Amis Lycée est clôturé. Taux de participation : 100%.', lu: true, created_at: '2026-06-28T18:00:00' },
  { id: '9', user_id: 'me', type: 'systeme',              titre: 'Bienvenue sur TontineDigitale',    message: 'Votre compte a été créé avec succès. Créez ou rejoignez une tontine pour commencer.', lu: true, created_at: '2025-12-20T10:00:00' },
];

type FiltreType = 'tous' | 'non_lus' | NotificationTypes;

// ── Config icône/couleur par type ────────────────
const NOTIF_CONFIG: Record<NotificationTypes | 'default', {
  icon: React.ElementType;
  bg: string;
  text: string;
  label: string;
}> = {
  rappel_paiement:      { icon: RiAlertLine,                 bg: 'bg-amber-100',  text: 'text-amber-600',  label: 'Rappel' },
  paiement_recu:        { icon: RiMoneyDollarCircleLine,     bg: 'bg-green-100',  text: 'text-green-600',  label: 'Paiement' },
  nouveau_membre:       { icon: RiGroupLine,                 bg: 'bg-blue-100',   text: 'text-blue-600',   label: 'Membre' },
  cycle_ouvert:         { icon: RiCalendarLine,              bg: 'bg-primary-100',text: 'text-primary-600',label: 'Cycle' },
  cycle_ferme:          { icon: RiCheckDoubleLine,           bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Cycle' },
  beneficiaire_annonce: { icon: RiCalendarLine,              bg: 'bg-violet-100', text: 'text-violet-600', label: 'Bénéficiaire' },
  penalite_appliquee:   { icon: RiAlertLine,                 bg: 'bg-red-100',    text: 'text-red-600',    label: 'Pénalité' },
  invitation_tontine:   { icon: RiGroupLine,                 bg: 'bg-teal-100',   text: 'text-teal-600',   label: 'Invitation' },
  systeme:              { icon: RiSettings3Line,             bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Système' },
  default:              { icon: RiBellLine,                  bg: 'bg-gray-100',   text: 'text-gray-500',   label: '' },
};

function getConfig(type: string) {
  return NOTIF_CONFIG[type as NotificationTypes] ?? NOTIF_CONFIG.default;
}

// ── Carte notification ───────────────────────────
function NotifCard({
  notif, onRead, onDelete,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = getConfig(notif.type);
  const Icon = cfg.icon;

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-4 border-b border-gray-100 last:border-0 transition-colors group',
      !notif.lu ? 'bg-primary-50/60 hover:bg-primary-50' : 'hover:bg-gray-50'
    )}>
      {/* Icône */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon className={`w-5 h-5 ${cfg.text}`} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn('text-sm font-semibold', !notif.lu ? 'text-gray-900' : 'text-gray-700')}>
              {notif.titre}
            </p>
            <span className={cn('badge text-xs', cfg.bg, cfg.text)}>{cfg.label}</span>
            {!notif.lu && (
              <RiCircleFill className="w-2 h-2 text-primary-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {formatDate(notif.created_at, { day: '2-digit', month: 'short' })}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{notif.message}</p>

        {/* Actions contextuelles */}
        {notif.type === 'invitation_tontine' && (
          <div className="flex gap-2 mt-2">
            <button className="btn-primary btn-sm">Accepter</button>
            <button className="btn-outline btn-sm">Refuser</button>
          </div>
        )}
        {notif.type === 'rappel_paiement' && (
          <button className="btn-primary btn-sm mt-2">Payer maintenant</button>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!notif.lu && (
          <button
            onClick={() => onRead(notif.id)}
            title="Marquer comme lu"
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <RiCheckDoubleLine className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notif.id)}
          title="Supprimer"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <RiDeleteBinLine className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────
export function NotificationsPage() {
  const [notifs,  setNotifs]  = useState(MOCK_NOTIFS);
  const [filtre,  setFiltre]  = useState<FiltreType>('tous');

  const nonLus = notifs.filter(n => !n.lu).length;

  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  }

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
  }

  function deleteNotif(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  function clearAll() {
    setNotifs(prev => prev.filter(n => !n.lu));
  }

  const FILTRES: { key: FiltreType; label: string; count?: number }[] = [
    { key: 'tous',                label: 'Toutes',       count: notifs.length },
    { key: 'non_lus',             label: 'Non lues',     count: nonLus },
    { key: 'rappel_paiement',     label: 'Rappels' },
    { key: 'paiement_recu',       label: 'Paiements' },
    { key: 'beneficiaire_annonce',label: 'Bénéficiaires' },
    { key: 'invitation_tontine',  label: 'Invitations' },
  ];

  const notifsFiltrees = notifs.filter(n => {
    if (filtre === 'tous')     return true;
    if (filtre === 'non_lus')  return !n.lu;
    return n.type === filtre;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="page-header !mb-0">
          <h1 className="page-title flex items-center gap-2">
            Notifications
            {nonLus > 0 && (
              <span className="w-6 h-6 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {nonLus}
              </span>
            )}
          </h1>
          <p className="page-subtitle">{notifs.length} notification{notifs.length > 1 ? 's' : ''}</p>
        </div>

        {/* Actions groupées */}
        <div className="flex gap-2">
          {nonLus > 0 && (
            <button onClick={markAllRead} className="btn-outline btn-sm">
              <RiCheckDoubleLine className="w-3.5 h-3.5" />
              Tout lire
            </button>
          )}
          {notifs.some(n => n.lu) && (
            <button onClick={clearAll} className="btn-outline btn-sm text-red-500 hover:bg-red-50 hover:border-red-200">
              <RiDeleteBinLine className="w-3.5 h-3.5" />
              Supprimer lues
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTRES.map(({ key, label, count }) => (
          <button key={key} onClick={() => setFiltre(key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
              filtre === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-600'
            )}>
            {label}{count !== undefined ? ` (${count})` : ''}
          </button>
        ))}
      </div>

      {/* Liste */}
      {notifsFiltrees.length === 0 ? (
        <div className="empty-state card">
          <RiInboxLine className="empty-state-icon" />
          <p className="font-semibold text-gray-500">Aucune notification</p>
          <p className="text-sm text-gray-400 mt-1">Vous êtes à jour !</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          {notifsFiltrees.map(n => (
            <NotifCard key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
          ))}
        </div>
      )}
    </div>
  );
}