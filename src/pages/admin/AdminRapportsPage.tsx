import { useState } from 'react';
import {
  RiLoader4Line, RiFilePdfLine, RiFileExcelLine,
  RiMoneyDollarCircleLine, RiGroupLine, RiStackLine,
  RiBarChartLine, RiAlertLine, RiUserAddLine,
} from 'react-icons/ri';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useQuery }    from '@tanstack/react-query';
import { supabase }   from '../../lib/supabase';
import { formatMontant, cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

function useRapports() {
  return useQuery({
    queryKey: ['admin_rapports'],
    queryFn: async () => {
      const [tRes, uRes, cRes] = await Promise.all([
        supabase.from('tontines').select('id, nom, statut, montant_cotisation, devise, frequence, nombre_membres_max, created_at, organisateur:profiles!tontines_organisateur_id_fkey(nom, prenom)'),
        supabase.from('profiles').select('id, nom, prenom, email, role_global, is_active, created_at'),
        supabase.from('cotisations').select('montant_paye, statut, created_at'),
      ]);

      const tontines    = tRes.data ?? [];
      const users       = uRes.data ?? [];
      const cotisations = cRes.data ?? [];

      const debutMois = new Date();
      debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);

      const stats = {
        total_tontines:         tontines.length,
        tontines_actives:       tontines.filter(t => t.statut === 'active').length,
        tontines_suspendues:    tontines.filter(t => t.statut === 'suspendue').length,
        tontines_terminees:     tontines.filter(t => t.statut === 'terminee').length,
        total_utilisateurs:     users.length,
        nouvelles_inscriptions: users.filter(u => new Date(u.created_at) >= debutMois).length,
        volume_collecte:        cotisations
          .filter(c => c.statut === 'payee')
          .reduce((s, c) => s + Number(c.montant_paye), 0),
        cotisations_retard: cotisations.filter(c => c.statut === 'en_retard').length,
        taux_participation: cotisations.length > 0
          ? Math.round((cotisations.filter(c => c.statut === 'payee').length / cotisations.length) * 100)
          : 0,
      };

      // Graphique mensuel des 12 derniers mois
      const parMois: Record<string, { collecte: number; retards: number; paiements: number }> = {};
      cotisations.forEach(c => {
        const d   = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!parMois[key]) parMois[key] = { collecte: 0, retards: 0, paiements: 0 };
        if (c.statut === 'payee') {
          parMois[key].collecte  += Number(c.montant_paye);
          parMois[key].paiements += 1;
        }
        if (c.statut === 'en_retard') parMois[key].retards += 1;
      });

      const graphique = Object.entries(parMois)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([key, vals]) => {
          const [y, m] = key.split('-');
          return {
            mois: new Date(Number(y), Number(m) - 1).toLocaleDateString('fr-FR', {
              month: 'short', year: '2-digit',
            }),
            ...vals,
          };
        });

      return { stats, graphique, tontines, users };
    },
  });
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {p.dataKey === 'collecte' ? formatMontant(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

const PIE_COLORS = ['#16a34a', '#f59e0b', '#94a3b8'];

// ── Téléchargement CSV générique ─────────────────
function telechargerCsv(nomFichier: string, entetes: string[], lignes: (string | number)[][]) {
  const echapper = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const contenu = [entetes, ...lignes].map(l => l.map(echapper).join(';')).join('\n');
  // \uFEFF : BOM UTF-8 pour un affichage correct des accents dans Excel
  const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = nomFichier;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── En-tête commun des PDF ───────────────────────
function entetePdf(doc: jsPDF, titre: string) {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('TontineDigitale', 14, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(titre, 14, 25);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 31);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 35, doc.internal.pageSize.getWidth() - 14, 35);
  return 42;
}

export function AdminRapportsPage() {
  const { data, isLoading } = useRapports();
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExportPdf(key: string) {
    if (!data) return;
    setExporting(key);
    try {
      const doc = new jsPDF();

      if (key === 'collecte' || key === 'general') {
        let y = entetePdf(doc, 'Rapport général — statistiques plateforme');
        autoTable(doc, {
          startY: y,
          head: [['Indicateur', 'Valeur']],
          body: [
            ['Volume total collecté', formatMontant(stats?.volume_collecte ?? 0)],
            ['Utilisateurs inscrits', String(stats?.total_utilisateurs ?? 0)],
            ['Tontines actives', `${stats?.tontines_actives ?? 0} / ${stats?.total_tontines ?? 0}`],
            ['Tontines suspendues', String(stats?.tontines_suspendues ?? 0)],
            ['Tontines terminées', String(stats?.tontines_terminees ?? 0)],
            ['Taux de participation', `${stats?.taux_participation ?? 0}%`],
            ['Cotisations en retard', String(stats?.cotisations_retard ?? 0)],
            ['Nouvelles inscriptions (ce mois)', String(stats?.nouvelles_inscriptions ?? 0)],
          ],
          theme: 'striped',
          headStyles: { fillColor: [22, 101, 52] },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
        doc.text('Liste des tontines', 14, y);
        autoTable(doc, {
          startY: y + 4,
          head: [['Nom', 'Statut', 'Cotisation', 'Fréquence', 'Organisateur']],
          body: data.tontines.map((t: any) => [
            t.nom, t.statut, formatMontant(t.montant_cotisation, t.devise), t.frequence,
            t.organisateur ? `${t.organisateur.prenom} ${t.organisateur.nom}` : '—',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [22, 101, 52] },
          styles: { fontSize: 8 },
        });
        doc.save(`rapport-general-${Date.now()}.pdf`);
      }

      if (key === 'financier') {
        let y = entetePdf(doc, 'Rapport financier');
        autoTable(doc, {
          startY: y,
          head: [['Mois', 'Collecte', 'Paiements', 'Retards']],
          body: graphique.map((g: any) => [g.mois, formatMontant(g.collecte), String(g.paiements), String(g.retards)]),
          theme: 'striped',
          headStyles: { fillColor: [22, 101, 52] },
        });
        doc.save(`rapport-financier-${Date.now()}.pdf`);
      }

      if (key === 'utilisateurs') {
        let y = entetePdf(doc, 'Rapport utilisateurs');
        autoTable(doc, {
          startY: y,
          head: [['Nom', 'Email', 'Rôle', 'Statut', 'Inscrit le']],
          body: data.users.map((u: any) => [
            `${u.prenom} ${u.nom}`, u.email, u.role_global, u.is_active ? 'Actif' : 'Désactivé',
            new Date(u.created_at).toLocaleDateString('fr-FR'),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [22, 101, 52] },
          styles: { fontSize: 8 },
        });
        doc.save(`rapport-utilisateurs-${Date.now()}.pdf`);
      }

      toast.success('Rapport PDF téléchargé !');
    } catch (e) {
      toast.error('Erreur lors de la génération du PDF.');
    } finally {
      setExporting(null);
    }
  }

  function handleExportCsv(key: string) {
    if (!data) return;
    setExporting(`${key}-csv`);
    try {
      if (key === 'collecte' || key === 'financier') {
        telechargerCsv(
          `rapport-financier-${Date.now()}.csv`,
          ['Mois', 'Collecte', 'Paiements', 'Retards'],
          graphique.map((g: any) => [g.mois, g.collecte, g.paiements, g.retards])
        );
      } else if (key === 'utilisateurs') {
        telechargerCsv(
          `rapport-utilisateurs-${Date.now()}.csv`,
          ['Nom', 'Prénom', 'Email', 'Rôle', 'Statut', 'Inscrit le'],
          data.users.map((u: any) => [u.nom, u.prenom, u.email, u.role_global, u.is_active ? 'Actif' : 'Désactivé', u.created_at])
        );
      } else {
        telechargerCsv(
          `rapport-general-${Date.now()}.csv`,
          ['Nom', 'Statut', 'Cotisation', 'Fréquence', 'Organisateur'],
          data.tontines.map((t: any) => [
            t.nom, t.statut, t.montant_cotisation, t.frequence,
            t.organisateur ? `${t.organisateur.prenom} ${t.organisateur.nom}` : '',
          ])
        );
      }
      toast.success('Fichier CSV téléchargé !');
    } catch {
      toast.error('Erreur lors de la génération du CSV.');
    } finally {
      setExporting(null);
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  const stats    = data?.stats;
  const graphique = data?.graphique ?? [];

  const PIE_DATA = [
    { name: 'Actives',    value: stats?.tontines_actives    ?? 0 },
    { name: 'Suspendues', value: stats?.tontines_suspendues ?? 0 },
    { name: 'Terminées',  value: stats?.tontines_terminees  ?? 0 },
  ].filter(d => d.value > 0);

  const KPI = [
    { label: 'Volume collecté',       val: formatMontant(stats?.volume_collecte ?? 0),                    cls: 'bg-primary-100 text-primary-700', icon: RiMoneyDollarCircleLine },
    { label: 'Utilisateurs',          val: String(stats?.total_utilisateurs ?? 0),                         cls: 'bg-blue-100 text-blue-700',       icon: RiGroupLine },
    { label: 'Tontines actives',      val: `${stats?.tontines_actives ?? 0}/${stats?.total_tontines ?? 0}`,cls: 'bg-amber-100 text-amber-700',     icon: RiStackLine },
    { label: 'Taux participation',    val: `${stats?.taux_participation ?? 0}%`,                           cls: 'bg-green-100 text-green-700',     icon: RiBarChartLine },
    { label: 'Retards',               val: String(stats?.cotisations_retard ?? 0),                         cls: 'bg-red-100 text-red-700',         icon: RiAlertLine },
    { label: 'Inscriptions ce mois',  val: `+${stats?.nouvelles_inscriptions ?? 0}`,                       cls: 'bg-violet-100 text-violet-700',   icon: RiUserAddLine },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Rapports & Analyses</h1>
        <p className="page-subtitle">Données en temps réel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI.map(({ label, val, cls, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${cls}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-display font-bold text-gray-900 dark:text-slate-100 mt-0.5">{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base">
              Volume collecté mensuel
            </h2>
            <button onClick={() => handleExportCsv('collecte')} className="btn-outline btn-sm">
              <RiFileExcelLine className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
          {graphique.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={graphique} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="collecte" name="Collecte" stroke="#16a34a"
                  strokeWidth={2.5} fill="url(#gc)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-slate-500 text-sm">
              Pas encore de données
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base mb-4">
            Répartition des tontines
          </h2>
          {PIE_DATA.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={3}>
                  {PIE_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} tontines`, '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-slate-500 text-sm">
              Pas encore de données
            </div>
          )}
        </div>
      </div>

      {graphique.length > 0 && (
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base mb-4">
            Retards de paiement par mois
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={graphique} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="retards" name="Retards" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Export */}
      <div className="card">
        <h2 className="font-display font-bold text-gray-900 dark:text-slate-100 text-base mb-4">
          Exporter les rapports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Rapport général',     desc: 'Toutes les statistiques plateforme', key: 'general' },
            { label: 'Rapport financier',   desc: 'Volumes, cotisations, pénalités',    key: 'financier' },
            { label: 'Rapport utilisateurs',desc: 'Activité et progression membres',    key: 'utilisateurs' },
          ].map(({ label, desc, key }) => (
            <div key={key} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm mb-1">{label}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">{desc}</p>
              <div className="flex gap-2">
                <button onClick={() => handleExportPdf(key)} disabled={!!exporting}
                  className="btn-outline btn-sm flex-1 justify-center">
                  {exporting === key
                    ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                    : <RiFilePdfLine className="w-3.5 h-3.5" />} PDF
                </button>
                <button onClick={() => handleExportCsv(key)} disabled={!!exporting}
                  className="btn-outline btn-sm flex-1 justify-center">
                  {exporting === `${key}-csv`
                    ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                    : <RiFileExcelLine className="w-3.5 h-3.5" />} CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}