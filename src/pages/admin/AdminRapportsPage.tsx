import { useState } from 'react';
import {
  RiDownloadLine, RiFilePdfLine, RiFileExcelLine,
  RiBarChartLine, RiMoneyDollarCircleLine, RiGroupLine,
  RiCalendarLine, RiFilterLine, RiLoader4Line,
  RiStackLine, RiArrowUpLine, RiArrowDownLine,
} from 'react-icons/ri';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatMontant, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ── Mock data ─────────────────────────────────────
const DATA_MENSUEL = [
  { mois: 'Jan', collecte: 950000,  membres: 98,  tontines: 18, retards: 4 },
  { mois: 'Fév', collecte: 1100000, membres: 105, tontines: 19, retards: 3 },
  { mois: 'Mar', collecte: 1350000, membres: 112, tontines: 20, retards: 5 },
  { mois: 'Avr', collecte: 1200000, membres: 110, tontines: 20, retards: 2 },
  { mois: 'Mai', collecte: 1480000, membres: 119, tontines: 21, retards: 6 },
  { mois: 'Jun', collecte: 1620000, membres: 128, tontines: 23, retards: 3 },
  { mois: 'Jul', collecte: 1750000, membres: 137, tontines: 24, retards: 7 },
];

const DATA_REPARTITION = [
  { name: 'Rotatif',  value: 16, color: '#16a34a' },
  { name: 'Fixe',     value: 5,  color: '#3b82f6' },
  { name: 'Enchères', value: 3,  color: '#f59e0b' },
];

const DATA_PARTICIPATION = [
  { tontine: 'Njangi Fonct.', taux: 96 },
  { tontine: 'Amis Lycée',    taux: 100 },
  { tontine: 'Épargne Fam.',  taux: 88 },
  { tontine: 'Diaspora Paris',taux: 78 },
  { tontine: 'Commerçantes',  taux: 95 },
];

const KPI = [
  { label: 'Volume total collecté',      val: formatMontant(9_450_000), delta: +8.4,  icon: RiMoneyDollarCircleLine, cls: 'bg-primary-100 text-primary-700' },
  { label: 'Utilisateurs actifs',        val: '137',                    delta: +12,   icon: RiGroupLine,             cls: 'bg-blue-100 text-blue-700' },
  { label: 'Tontines en cours',          val: '18 / 24',               delta: +3,    icon: RiStackLine,             cls: 'bg-amber-100 text-amber-700' },
  { label: 'Taux de participation moyen',val: '91%',                   delta: +2.1,  icon: RiBarChartLine,          cls: 'bg-green-100 text-green-700' },
];

type PeriodeType = '3mois' | '6mois' | '12mois';

// ── Tooltip custom ───────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {p.dataKey === 'collecte' ? formatMontant(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Export PDF simulé ────────────────────────────
async function exporterPDF(titre: string) {
  toast.loading('Génération du PDF…', { id: 'pdf' });
  await new Promise(r => setTimeout(r, 1500));
  toast.success(`${titre} exporté en PDF !`, { id: 'pdf' });
}

// ── Page principale ─────────────────────────────
export function AdminRapportsPage() {
  const [periode,   setPeriode]   = useState<PeriodeType>('6mois');
  const [exporting, setExporting] = useState<string | null>(null);

  const data = DATA_MENSUEL.slice(
    periode === '3mois' ? -3 : periode === '6mois' ? -6 : 0
  );

  async function handleExport(type: string, format: 'pdf' | 'csv') {
    setExporting(`${type}-${format}`);
    await new Promise(r => setTimeout(r, 1200));
    if (format === 'pdf') {
      toast.success(`Rapport ${type} exporté en PDF !`);
    } else {
      const csv = `Mois,Collecte,Membres\n${data.map(d => `${d.mois},${d.collecte},${d.membres}`).join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url;
      a.download = `rapport_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('CSV téléchargé !');
    }
    setExporting(null);
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header !mb-0">
          <h1 className="page-title">Rapports & Analyses</h1>
          <p className="page-subtitle">Indicateurs clés de la plateforme TontineDigitale</p>
        </div>

        {/* Sélecteur période */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          {(['3mois', '6mois', '12mois'] as PeriodeType[]).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                periode === p ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
              )}>
              {p === '3mois' ? '3 mois' : p === '6mois' ? '6 mois' : '12 mois'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map(({ label, val, delta, icon: Icon, cls }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${cls}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-xl font-display font-bold text-gray-900 leading-tight mt-0.5">{val}</p>
              <div className={cn('flex items-center gap-1 text-xs mt-1',
                delta >= 0 ? 'text-green-600' : 'text-red-500'
              )}>
                {delta >= 0
                  ? <RiArrowUpLine className="w-3 h-3" />
                  : <RiArrowDownLine className="w-3 h-3" />}
                {Math.abs(delta)}{String(delta).includes('.') ? '%' : ''} ce mois
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Collecte */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Volume collecté</h2>
            <div className="flex gap-2">
              <button onClick={() => handleExport('collecte', 'csv')} disabled={!!exporting}
                className="btn-outline btn-sm">
                <RiFileExcelLine className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => handleExport('collecte', 'pdf')} disabled={!!exporting}
                className="btn-outline btn-sm">
                {exporting === 'collecte-pdf'
                  ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                  : <RiFilePdfLine className="w-3.5 h-3.5" />} PDF
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="collecte" name="Collecte" stroke="#16a34a"
                strokeWidth={2.5} fill="url(#gc)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Membres + Retards */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Membres & Retards</h2>
            <button onClick={() => handleExport('membres', 'csv')} disabled={!!exporting}
              className="btn-outline btn-sm">
              <RiFileExcelLine className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="membres" name="Membres" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="retards" name="Retards" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphiques ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Répartition types */}
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">Répartition par type de tontine</h2>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={DATA_REPARTITION} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {DATA_REPARTITION.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [`${val} tontines`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-shrink-0">
              {DATA_REPARTITION.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.value} tontines</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Taux de participation */}
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">Taux de participation par tontine</h2>
          <div className="space-y-3">
            {DATA_PARTICIPATION.map(d => (
              <div key={d.tontine}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{d.tontine}</span>
                  <span className={cn('text-sm font-bold',
                    d.taux >= 90 ? 'text-green-600' : d.taux >= 75 ? 'text-amber-600' : 'text-red-500'
                  )}>{d.taux}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all',
                    d.taux >= 90 ? 'bg-green-500' : d.taux >= 75 ? 'bg-amber-400' : 'bg-red-400'
                  )} style={{ width: `${d.taux}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exports globaux */}
      <div className="card">
        <h2 className="font-display font-bold text-gray-900 text-base mb-4">Exporter les rapports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Rapport général',          desc: 'Toutes les statistiques de la plateforme', key: 'general' },
            { label: 'Rapport financier',         desc: 'Volumes collectés, cotisations, pénalités', key: 'financier' },
            { label: 'Rapport utilisateurs',      desc: 'Activité, scores et progression', key: 'utilisateurs' },
          ].map(({ label, desc, key }) => (
            <div key={key} className="border border-gray-200 rounded-xl p-4">
              <p className="font-semibold text-gray-800 text-sm mb-1">{label}</p>
              <p className="text-xs text-gray-400 mb-4">{desc}</p>
              <div className="flex gap-2">
                <button onClick={() => handleExport(key, 'pdf')} disabled={!!exporting}
                  className="btn-outline btn-sm flex-1 justify-center">
                  {exporting === `${key}-pdf`
                    ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                    : <RiFilePdfLine className="w-3.5 h-3.5" />} PDF
                </button>
                <button onClick={() => handleExport(key, 'csv')} disabled={!!exporting}
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