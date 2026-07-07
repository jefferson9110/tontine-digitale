import { useState, useRef, useEffect } from 'react';
import {
  RiSendPlaneLine, RiGroupLine, RiLoader4Line,
  RiEmotionLine, RiAttachment2, RiCheckDoubleLine,
  RiCircleFill, RiSearchLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, cn } from '../../lib/utils';

// ── Types ────────────────────────────────────────
interface Conversation {
  id: string;
  tontine_nom: string;
  tontine_id: string;
  dernier_message: string;
  dernier_message_date: string;
  non_lus: number;
  membres_count: number;
  avatar_lettre: string;
}

interface Message {
  id: string;
  user_id: string;
  user_nom: string;
  user_initiales: string;
  contenu: string;
  created_at: string;
  est_moi: boolean;
}

// ── Mock data ────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1', tontine_id: '1', tontine_nom: 'Njangi Fonctionnaires Yaoundé',
    dernier_message: 'Solange n\'a pas encore payé pour ce mois, quelqu\'un a des nouvelles ?',
    dernier_message_date: '2026-07-06T14:32:00', non_lus: 3, membres_count: 12, avatar_lettre: 'N',
  },
  {
    id: 'c2', tontine_id: '2', tontine_nom: 'Tontine Amis Lycée',
    dernier_message: 'Super ! Je viens de recevoir ma cagnotte. Merci tout le monde 🙏',
    dernier_message_date: '2026-07-05T09:15:00', non_lus: 0, membres_count: 8, avatar_lettre: 'T',
  },
  {
    id: 'c3', tontine_id: '3', tontine_nom: 'Épargne Famille Tenkam',
    dernier_message: 'Le prochain versement est prévu pour le 15 juillet.',
    dernier_message_date: '2026-07-03T18:00:00', non_lus: 1, membres_count: 6, avatar_lettre: 'É',
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: '1', user_id: 'u1', user_nom: 'Marcelline T.', user_initiales: 'MT', contenu: 'Bonjour à tous ! Rappel : le cycle 8 est ouvert. Cotisation due avant le 10 juillet.', created_at: '2026-07-01T08:00:00', est_moi: false },
    { id: '2', user_id: 'u2', user_nom: 'Patrick N.',    user_initiales: 'PN', contenu: 'Bonjour Marcelline ! J\'ai déjà envoyé via MTN MoMo ce matin. Référence MTN-001.', created_at: '2026-07-01T09:30:00', est_moi: false },
    { id: '3', user_id: 'me', user_nom: 'Moi',           user_initiales: 'SK', contenu: 'Bonjour tout le monde. Je vais payer ce soir dès que je rentre du bureau.', created_at: '2026-07-01T11:00:00', est_moi: true },
    { id: '4', user_id: 'u1', user_nom: 'Marcelline T.', user_initiales: 'MT', contenu: 'Merci Patrick ! Solange, pas de problème, on note.', created_at: '2026-07-01T11:05:00', est_moi: false },
    { id: '5', user_id: 'u4', user_nom: 'Jean-Paul M.',  user_initiales: 'JM', contenu: 'Bonjour ! Est-ce qu\'on a décidé de l\'ordre pour les prochains cycles ? Je suis disponible pour le cycle 10 si personne ne le revendique.', created_at: '2026-07-04T14:00:00', est_moi: false },
    { id: '6', user_id: 'u1', user_nom: 'Marcelline T.', user_initiales: 'MT', contenu: 'Jean-Paul, le vote est ouvert pour le cycle 10. Allez voter dans l\'onglet Bénéficiaires !', created_at: '2026-07-04T14:30:00', est_moi: false },
    { id: '7', user_id: 'u5', user_nom: 'Armand B.',     user_initiales: 'AB', contenu: 'Solange n\'a pas encore payé pour ce mois, quelqu\'un a des nouvelles ?', created_at: '2026-07-06T14:32:00', est_moi: false },
  ],
  c2: [
    { id: '1', user_id: 'u8', user_nom: 'Cécile A.',  user_initiales: 'CA', contenu: 'Super ! Je viens de recevoir ma cagnotte. Merci tout le monde 🙏', created_at: '2026-07-05T09:15:00', est_moi: false },
    { id: '2', user_id: 'me', user_nom: 'Moi',         user_initiales: 'SK', contenu: 'Félicitations Cécile ! Bien mérité.', created_at: '2026-07-05T09:20:00', est_moi: true },
  ],
  c3: [
    { id: '1', user_id: 'u10', user_nom: 'Papa T.',  user_initiales: 'PT', contenu: 'Le prochain versement est prévu pour le 15 juillet.', created_at: '2026-07-03T18:00:00', est_moi: false },
  ],
};

// ── Bulle de message ─────────────────────────────
function MessageBubble({ msg, showAvatar }: { msg: Message; showAvatar: boolean }) {
  const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (msg.est_moi) {
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
          {msg.user_initiales}
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}
      <div className="max-w-xs lg:max-w-md">
        {showAvatar && (
          <p className="text-xs text-gray-400 mb-1 ml-1">{msg.user_nom}</p>
        )}
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed">{msg.contenu}</p>
        </div>
        <span className="text-xs text-gray-400 ml-1 mt-1 block">{time}</span>
      </div>
    </div>
  );
}

// ── Séparateur de date ────────────────────────────
function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) label = 'Aujourd\'hui';
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

// ── Page principale ─────────────────────────────
export function MessagesPage() {
  const { profile } = useAuth();
  const [convActive, setConvActive] = useState<Conversation>(MOCK_CONVERSATIONS[0]);
  const [messages,   setMessages]   = useState<Message[]>(MOCK_MESSAGES[MOCK_CONVERSATIONS[0].id] ?? []);
  const [texte,      setTexte]      = useState('');
  const [envoi,      setEnvoi]      = useState(false);
  const [search,     setSearch]     = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function selectConv(conv: Conversation) {
    setConvActive(conv);
    setMessages(MOCK_MESSAGES[conv.id] ?? []);
    setTexte('');
  }

  async function envoyer() {
    if (!texte.trim() || envoi) return;
    setEnvoi(true);
    const nouveau: Message = {
      id:            Date.now().toString(),
      user_id:       'me',
      user_nom:      'Moi',
      user_initiales: profile ? `${profile.prenom?.charAt(0)}${profile.nom?.charAt(0)}` : 'ME',
      contenu:       texte.trim(),
      created_at:    new Date().toISOString(),
      est_moi:       true,
    };
    setMessages(prev => [...prev, nouveau]);
    setTexte('');
    setEnvoi(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyer();
    }
  }

  const convsFiltrees = MOCK_CONVERSATIONS.filter(c =>
    c.tontine_nom.toLowerCase().includes(search.toLowerCase())
  );

  // Grouper messages par date
  const messagesByDate: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const date = msg.created_at.split('T')[0];
    const last = messagesByDate[messagesByDate.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else messagesByDate.push({ date, msgs: [msg] });
  });

  return (
    <div className="flex h-[calc(100vh-10rem)] rounded-2xl border border-gray-100 overflow-hidden shadow-card bg-white">

      {/* ── Colonne gauche : liste conversations ── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col hidden md:flex">
        {/* En-tête */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="search" placeholder="Rechercher…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-8 py-2 text-sm"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {convsFiltrees.map(conv => (
            <button key={conv.id} onClick={() => selectConv(conv)} className={cn(
              'w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors',
              convActive.id === conv.id && 'bg-primary-50 border-l-4 border-l-primary-500'
            )}>
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
                  {conv.avatar_lettre}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="font-semibold text-gray-800 text-sm truncate">{conv.tontine_nom}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(conv.dernier_message_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs text-gray-400 truncate">{conv.dernier_message}</p>
                    {conv.non_lus > 0 && (
                      <span className="w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.non_lus}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <RiGroupLine className="w-3 h-3 text-gray-300" />
                    <span className="text-xs text-gray-300">{conv.membres_count} membres</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Colonne droite : chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header chat */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
          <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
            {convActive.avatar_lettre}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-gray-900 truncate">{convActive.tontine_nom}</p>
            <div className="flex items-center gap-1.5">
              <RiCircleFill className="w-2 h-2 text-green-500" />
              <span className="text-xs text-gray-400">{convActive.membres_count} membres</span>
            </div>
          </div>
        </div>

        {/* Zone messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 bg-gray-50/50">
          {messagesByDate.map(({ date, msgs }) => (
            <div key={date}>
              <DateSeparator date={`${date}T00:00:00`} />
              {msgs.map((msg, i) => {
                const prevMsg = i > 0 ? msgs[i - 1] : null;
                const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id;
                return <MessageBubble key={msg.id} msg={msg} showAvatar={showAvatar} />;
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone saisie */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={texte}
                onChange={e => setTexte(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrire un message… (Entrée pour envoyer)"
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none max-h-28 scrollbar-hide"
                style={{ minHeight: '22px' }}
                disabled={envoi}
              />
            </div>
            <button
              onClick={envoyer}
              disabled={!texte.trim() || envoi}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                texte.trim() && !envoi
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {envoi
                ? <RiLoader4Line className="w-4 h-4 animate-spin" />
                : <RiSendPlaneLine className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-center">
            Shift+Entrée pour aller à la ligne
          </p>
        </div>
      </div>
    </div>
  );
}