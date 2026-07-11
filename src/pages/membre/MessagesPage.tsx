import { useState, useRef, useEffect } from 'react';
import {
  RiSendPlaneLine, RiGroupLine, RiLoader4Line,
  RiCheckDoubleLine, RiCircleFill, RiSearchLine,
} from 'react-icons/ri';
import { useAuth }                                   from '../../contexts/AuthContext';
import { useMessages, useEnvoyerMessage,
         useConversations }                          from '../../hooks/useMessages';
import { formatDate, cn } from '../../lib/utils';

// ── Bulle message ────────────────────────────────
function MessageBubble({ msg, showAvatar, moi }: {
  msg: any; showAvatar: boolean; moi: boolean;
}) {
  const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (moi) {
    return (
      <div className="flex justify-end gap-2 mb-1">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed">{msg.contenu}</p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 px-1">
            <span className="text-xs text-gray-400">{time}</span>
            <RiCheckDoubleLine className="w-3.5 h-3.5 text-primary-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-1">
      {showAvatar ? (
        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
          {msg.user?.prenom?.charAt(0)}{msg.user?.nom?.charAt(0)}
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}
      <div className="max-w-xs lg:max-w-md">
        {showAvatar && (
          <p className="text-xs text-gray-400 mb-1 ml-1">{msg.user?.prenom} {msg.user?.nom}</p>
        )}
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed">{msg.contenu}</p>
        </div>
        <span className="text-xs text-gray-400 ml-1 mt-1 block">{time}</span>
      </div>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  const d         = new Date(date);
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  let label: string;
  if (d.toDateString() === today.toDateString())     label = "Aujourd'hui";
  else if (d.toDateString() === yesterday.toDateString()) label = 'Hier';
  else label = formatDate(date);

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-400 font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── Zone de chat ─────────────────────────────────
function ChatZone({ tontineId, userId }: { tontineId: string; userId: string }) {
  const { data: messages = [], isLoading } = useMessages(tontineId);
  const envoyer = useEnvoyerMessage();
  const [texte, setTexte] = useState('');
  const endRef     = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function envoie() {
    if (!texte.trim() || envoyer.isPending) return;
    const contenu = texte.trim();
    setTexte('');
    await envoyer.mutateAsync({ tontineId, userId, contenu });
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoie(); }
  }

  // Grouper par date
  const parDate: { date: string; msgs: typeof messages }[] = [];
  messages.forEach(msg => {
    const date = msg.created_at.split('T')[0];
    const last = parDate[parDate.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else parDate.push({ date, msgs: [msg] });
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 bg-gray-50/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RiLoader4Line className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p className="text-sm">Aucun message pour l'instant.</p>
            <p className="text-xs mt-1">Soyez le premier à écrire !</p>
          </div>
        ) : (
          parDate.map(({ date, msgs }) => (
            <div key={date}>
              <DateSeparator date={`${date}T00:00:00`} />
              {msgs.map((msg, i) => {
                const prev      = i > 0 ? msgs[i - 1] : null;
                const showAvatar = !prev || prev.user_id !== msg.user_id;
                const moi       = msg.user_id === userId;
                return <MessageBubble key={msg.id} msg={msg} showAvatar={showAvatar} moi={moi} />;
              })}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Saisie */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <textarea ref={textareaRef} value={texte}
              onChange={e => setTexte(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Écrire un message… (Entrée pour envoyer)"
              rows={1} disabled={envoyer.isPending}
              className="flex-1 w-full bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none max-h-28 scrollbar-hide"
              style={{ minHeight: '22px' }} />
          </div>
          <button onClick={envoie} disabled={!texte.trim() || envoyer.isPending}
            className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              texte.trim() && !envoyer.isPending
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}>
            {envoyer.isPending
              ? <RiLoader4Line className="w-4 h-4 animate-spin" />
              : <RiSendPlaneLine className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">Shift+Entrée pour aller à la ligne</p>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────
export function MessagesPage() {
  const { profile } = useAuth();
  const { data: conversations = [], isLoading } = useConversations(profile?.id);

  const [convActive, setConvActive] = useState<typeof conversations[0] | null>(null);
  const [search,     setSearch]     = useState('');

  const convsFiltrees = conversations.filter(c =>
    c.tontine_nom.toLowerCase().includes(search.toLowerCase())
  );

  // Sélectionner la première conversation automatiquement
  useEffect(() => {
    if (conversations.length > 0 && !convActive) {
      setConvActive(conversations[0]);
    }
  }, [conversations]);

  return (
    <div className="flex h-[calc(100vh-10rem)] rounded-2xl border border-gray-100 overflow-hidden shadow-card bg-white">
      {/* Colonne gauche */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="search" placeholder="Rechercher…" value={search}
              onChange={e => setSearch(e.target.value)} className="input pl-8 py-2 text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <RiLoader4Line className="w-5 h-5 text-primary-500 animate-spin" />
            </div>
          ) : convsFiltrees.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm px-4">
              <RiGroupLine className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Aucune conversation</p>
              <p className="text-xs mt-1">Rejoignez une tontine pour échanger</p>
            </div>
          ) : (
            convsFiltrees.map(conv => (
              <button key={conv.tontine_id} onClick={() => setConvActive(conv)}
                className={cn('w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                  convActive?.tontine_id === conv.tontine_id && 'bg-primary-50 border-l-4 border-l-primary-500'
                )}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
                    {conv.tontine_nom.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="font-semibold text-gray-800 text-sm truncate">{conv.tontine_nom}</p>
                      {conv.dernier_message_date && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(conv.dernier_message_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-gray-400 truncate">{conv.dernier_message}</p>
                      {conv.non_lus > 0 && (
                        <span className="w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.non_lus > 9 ? '9+' : conv.non_lus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Colonne droite : chat */}
      {convActive && profile ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700">
              {convActive.tontine_nom.charAt(0)}
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 truncate">{convActive.tontine_nom}</p>
              <div className="flex items-center gap-1.5">
                <RiCircleFill className="w-2 h-2 text-green-500" />
                <span className="text-xs text-gray-400">Actif</span>
              </div>
            </div>
          </div>
          <ChatZone tontineId={convActive.tontine_id} userId={profile.id} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <RiGroupLine className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Sélectionnez une conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}
