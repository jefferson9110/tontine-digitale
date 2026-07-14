import { useState } from 'react';
import {
  RiBellLine, RiCheckLine, RiCloseLine, RiLoader4Line,
  RiGroupLine, RiMoneyDollarCircleLine, RiAlertLine,
  RiInboxLine, RiCheckDoubleLine, RiTimeLine,
} from 'react-icons/ri';
import { useAuth }       from '../../contexts/AuthContext';
import { useQuery,
         useMutation,
         useQueryClient } from '@tanstack/react-query';
import { supabase }      from '../../lib/supabase';
import { useEffect }     from 'react';
import { cn }            from '../../lib/utils';
import toast             from 'react-hot-toast';

// ── Icône par type de notification ───────────────
function NotifIcon({ type }: { type: string }) {
  const cls = "w-5 h-5";
  switch (type) {
    case 'invitation_tontine':    return <RiGroupLine className={cls} />;
    case 'paiement_recu':        return <RiMoneyDollarCircleLine className={cls} />;
    case 'nouveau_membre':       return <RiGroupLine className={cls} />;
    case 'rappel_paiement':      return <RiTimeLine className={cls} />;
    case 'penalite_appliquee':   return <RiAlertLine className={cls} />;
    case 'cycle_ouvert':         return <RiCheckDoubleLine className={cls} />;
    default:                     return <RiBellLine className={cls} />;
  }
}

function notifBg(type: string) {
  switch (type) {
    case 'invitation_tontine':  return 'bg-primary-100 text-primary-700';
    case 'paiement_recu':       return 'bg-green-100 text-green-700';
    case 'nouveau_membre':      return 'bg-blue-100 text-blue-700';
    case 'rappel_paiement':     return 'bg-amber-100 text-amber-700';
    case 'penalite_appliquee':  return 'bg-red-100 text-red-700';
    case 'cycle_ouvert':        return 'bg-violet-100 text-violet-700';
    default:                    return 'bg-gray-100 text-gray-600';
  }
}

// ── Card invitation avec boutons ─────────────────
function CardInvitation({
  notif, onRepondu,
}: {
  notif: any;
  onRepondu: () => void;
}) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState<'accepter' | 'refuser' | null>(null);
  const [traite,  setTraite]  = useState(false);

  const data = notif.data ?? {};

  async function repondre(reponse: 'accepter' | 'refuser') {
    if (!data.invitation_id) return;
    setLoading(reponse);
    try {
      const { data: result, error } = await supabase
        .rpc('repondre_invitation', {
          p_invitation_id: data.invitation_id,
          p_reponse:       reponse,
        });

      if (error) throw error;
      if (result && !result.success) throw new Error(result.message);

      // Marquer la notification comme lue
      await supabase.from('notifications')
        .update({ lu: true }).eq('id', notif.id);

      toast.success(result?.message ?? (reponse === 'accepter' ? 'Invitation acceptée !' : 'Invitation refusée.'));
      setTraite(true);
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['mes_tontines'] });
      onRepondu();
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur');
    } finally {
      setLoading(null);
    }
  }

  if (traite) return null;

  return (
    <div className="card border-2 border-primary-200 bg-primary-50/40 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <RiGroupLine className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-sm">{notif.titre}</p>
            <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 animate-pulse" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{notif.message}</p>

          {/* Détails tontine */}
          {data.montant && (
            <div className="bg-white rounded-xl p-3 border border-primary-100 mb-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Tontine</p>
                  <p className="font-semibold text-gray-800">{data.tontine_nom ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Cotisation</p>
                  <p className="font-semibold text-gray-800">
                    {Number(data.montant).toLocaleString()} {data.devise} / {data.frequence}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Invité par</p>
                  <p className="font-semibold text-gray-800">{data.invite_par_nom ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={() => repondre('refuser')}
              disabled={!!loading}
              className="btn-outline flex-1 justify-center border-red-200 text-red-600 hover:bg-red-50"
            >
              {loading === 'refuser'
                ? <RiLoader4Line className="w-4 h-4 animate-spin" />
                : <RiCloseLine className="w-4 h-4" />}
              Décliner
            </button>
            <button
              onClick={() => repondre('accepter')}
              disabled={!!loading}
              className="btn-primary flex-1 justify-center"
            >
              {loading === 'accepter'
                ? <RiLoader4Line className="w-4 h-4 animate-spin" />
                : <RiCheckLine className="w-4 h-4" />}
              Rejoindre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hook notifications ────────────────────────────
function useNotifications(userId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', userId],
    enabled:  !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => qc.invalidateQueries({ queryKey: ['notifications', userId] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  return query;
}

// ── Page principale ───────────────────────────────
export function NotificationsPage() {
  const { profile } = useAuth();
  const qc          = useQueryClient();
  const { data: notifications = [], isLoading, refetch } = useNotifications(profile?.id);

  const [filtre, setFiltre] = useState<'toutes' | 'invitations' | 'non_lues'>('toutes');

  const marquerToutesLues = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('user_id', profile.id)
        .eq('lu', false);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Toutes les notifications marquées comme lues.');
    },
  });

  const marquerLue = async (id: string) => {
    await supabase.from('notifications').update({ lu: true }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const nbNonLues     = notifications.filter(n => !n.lu).length;
  const invitations   = notifications.filter(n => n.type === 'invitation_tontine' && !n.lu);

  const filtrees = notifications.filter(n => {
    if (filtre === 'invitations') return n.type === 'invitation_tontine';
    if (filtre === 'non_lues')    return !n.lu;
    return true;
  });

  const FILTRES = [
    { key: 'toutes',      label: `Toutes (${notifications.length})` },
    { key: 'invitations', label: `Invitations (${notifications.filter(n => n.type === 'invitation_tontine').length})` },
    { key: 'non_lues',    label: `Non lues (${nbNonLues})` },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="page-header !mb-0">
          <h1 className="page-title flex items-center gap-2">
            <RiBellLine className="w-6 h-6 text-primary-600" />
            Notifications
          </h1>
          <p className="page-subtitle">
            {nbNonLues > 0
              ? `${nbNonLues} notification${nbNonLues > 1 ? 's' : ''} non lue${nbNonLues > 1 ? 's' : ''}`
              : 'Tout est à jour'}
          </p>
        </div>
        {nbNonLues > 0 && (
          <button
            onClick={() => marquerToutesLues.mutate()}
            disabled={marquerToutesLues.isPending}
            className="btn-outline btn-sm flex-shrink-0"
          >
            {marquerToutesLues.isPending
              ? <RiLoader4Line className="w-4 h-4 animate-spin" />
              : <RiCheckDoubleLine className="w-4 h-4" />}
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Invitations en attente — section prioritaire */}
      {invitations.length > 0 && filtre === 'toutes' && (
        <div className="space-y-3">
          <h2 className="font-display font-bold text-gray-900 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            Invitations en attente ({invitations.length})
          </h2>
          {invitations.map(notif => (
            <CardInvitation key={notif.id} notif={notif} onRepondu={refetch} />
          ))}
          <div className="border-t border-gray-100 pt-2" />
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTRES.map(({ key, label }) => (
          <button key={key} onClick={() => setFiltre(key as any)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
              filtre === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filtrees.length === 0 ? (
        <div className="card text-center py-16">
          <RiInboxLine className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrees.map(notif => {
            // Les invitations non lues → composant spécial avec boutons
            if (notif.type === 'invitation_tontine' && !notif.lu && notif.data?.invitation_id) {
              return (
                <CardInvitation key={notif.id} notif={notif} onRepondu={refetch} />
              );
            }

            // Notification standard
            return (
              <div key={notif.id}
                onClick={() => !notif.lu && marquerLue(notif.id)}
                className={cn(
                  'card flex items-start gap-3 cursor-pointer transition-all',
                  !notif.lu ? 'border-primary-100 bg-primary-50/30' : 'opacity-80'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  notifBg(notif.type)
                )}>
                  <NotifIcon type={notif.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-semibold', notif.lu ? 'text-gray-600' : 'text-gray-900')}>
                      {notif.titre}
                    </p>
                    {!notif.lu && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}