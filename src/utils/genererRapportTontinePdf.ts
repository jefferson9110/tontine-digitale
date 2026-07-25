import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMontant } from '../lib/utils';

interface MembreRapport {
  nom: string;
  prenom: string;
  role: string;
  statut: string;
  a_beneficie: boolean;
  score: number;
}

interface CotisationRapport {
  statut: string;
  montant_du: number;
  montant_paye: number;
  penalite: number;
  cycle_numero: number;
}

interface DonneesTontine {
  nom: string;
  description?: string;
  statut: string;
  type: string;
  montant_cotisation: number;
  devise: string;
  frequence: string;
  cycle_actuel: number;
  total_cycles: number;
  nombre_membres_max: number;
  date_debut: string;
}

function calculerScore(cotisationsUtilisateur: CotisationRapport[]): number {
  if (cotisationsUtilisateur.length === 0) return 50;
  const total     = cotisationsUtilisateur.length;
  const payees    = cotisationsUtilisateur.filter(c => c.statut === 'payee').length;
  const retards   = cotisationsUtilisateur.filter(c => c.statut === 'en_retard').length;
  const penalites = cotisationsUtilisateur.reduce((s, c) => s + c.penalite, 0);
  const totalDu   = cotisationsUtilisateur.reduce((s, c) => s + c.montant_du, 0);

  const tauxPaiement  = total > 0 ? (payees / total) * 60 : 0;
  const malusRetard   = Math.min(retards * 5, 20);
  const malusPenalite = totalDu > 0 ? Math.min((penalites / totalDu) * 100 * 0.2, 20) : 0;
  const bonusCycles   = Math.min(total * 2, 20);

  return Math.round(Math.max(0, Math.min(100, tauxPaiement + bonusCycles - malusRetard - malusPenalite)));
}

// ── Synthèse textuelle générée par règles ────────
function genererSynthese(params: {
  tontine: DonneesTontine;
  membres: MembreRapport[];
  tauxParticipation: number;
  totalCollecte: number;
  totalRetards: number;
  membresRisque: MembreRapport[];
}): string[] {
  const { tontine, membres, tauxParticipation, totalRetards, membresRisque } = params;
  const lignes: string[] = [];

  const progression = tontine.total_cycles > 0
    ? Math.round((tontine.cycle_actuel / tontine.total_cycles) * 100) : 0;

  lignes.push(
    `La tontine "${tontine.nom}" en est à son cycle ${tontine.cycle_actuel} sur ${tontine.total_cycles} ` +
    `(${progression}% de progression) et compte ${membres.length}/${tontine.nombre_membres_max} membres.`
  );

  if (tauxParticipation >= 90) {
    lignes.push(`Le taux de participation est excellent (${tauxParticipation}%), la dynamique du groupe est saine.`);
  } else if (tauxParticipation >= 70) {
    lignes.push(`Le taux de participation est correct (${tauxParticipation}%), avec une marge d'amélioration possible.`);
  } else {
    lignes.push(`Le taux de participation est préoccupant (${tauxParticipation}%) et mérite une attention particulière de l'organisateur.`);
  }

  if (totalRetards === 0) {
    lignes.push(`Aucun retard de paiement n'est à signaler sur la période.`);
  } else {
    lignes.push(`${totalRetards} cotisation(s) en retard ont été enregistrées sur la période.`);
  }

  if (membresRisque.length > 0) {
    const noms = membresRisque.slice(0, 5).map(m => `${m.prenom} ${m.nom} (score ${m.score})`).join(', ');
    lignes.push(`Membre(s) à surveiller (score TontineScore faible) : ${noms}.`);
  } else {
    lignes.push(`Aucun membre ne présente de score de fiabilité inquiétant à ce jour.`);
  }

  return lignes;
}

function entetePdf(doc: jsPDF, tontineNom: string) {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('TontineDigitale', 14, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Rapport de situation — ${tontineNom}`, 14, 25);
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    14, 31
  );
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 35, doc.internal.pageSize.getWidth() - 14, 35);
  return 42;
}

export async function genererRapportTontinePdf(
  tontine: DonneesTontine,
  membres: MembreRapport[],
  cotisations: CotisationRapport[],
  cotisationsParUtilisateur: Record<string, CotisationRapport[]>,
): Promise<void> {
  const doc = new jsPDF();
  let y = entetePdf(doc, tontine.nom);

  const totalCollecte      = cotisations.reduce((s, c) => s + Number(c.montant_paye), 0);
  const totalDu            = cotisations.reduce((s, c) => s + Number(c.montant_du), 0);
  const totalRetards       = cotisations.filter(c => c.statut === 'en_retard').length;
  const tauxParticipation  = cotisations.length > 0
    ? Math.round((cotisations.filter(c => c.statut === 'payee').length / cotisations.length) * 100) : 0;

  const membresAvecScore = membres.map(m => ({
    ...m,
    score: calculerScore(cotisationsParUtilisateur[`${m.prenom}|${m.nom}`] ?? []),
  }));
  const membresRisque = membresAvecScore.filter(m => m.score < 50).sort((a, b) => a.score - b.score);

  // KPIs
  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Statut', tontine.statut],
      ['Type', tontine.type],
      ['Cotisation', `${formatMontant(tontine.montant_cotisation, tontine.devise as any)} / ${tontine.frequence}`],
      ['Cycle', `${tontine.cycle_actuel} / ${tontine.total_cycles}`],
      ['Membres', `${membres.length} / ${tontine.nombre_membres_max}`],
      ['Total collecté', formatMontant(totalCollecte, tontine.devise as any)],
      ['Total attendu', formatMontant(totalDu, tontine.devise as any)],
      ['Taux de participation', `${tauxParticipation}%`],
      ['Cotisations en retard', String(totalRetards)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52] },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Synthèse
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text('Synthèse', 14, y);
  y += 6;
  doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
  const synthese = genererSynthese({ tontine, membres: membresAvecScore, tauxParticipation, totalCollecte, totalRetards, membresRisque });
  for (const ligne of synthese) {
    const wrapped = doc.splitTextToSize(ligne, doc.internal.pageSize.getWidth() - 28);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 5 + 2;
  }
  y += 6;

  // Tableau membres
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text('Membres', 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [['Nom', 'Rôle', 'Statut', 'A bénéficié', 'Score']],
    body: membresAvecScore.map(m => [
      `${m.prenom} ${m.nom}`, m.role, m.statut, m.a_beneficie ? 'Oui' : 'Non', String(m.score),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 8 },
  });

  doc.save(`rapport-${tontine.nom.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}

// ────────────────────────────────────────────────
// Évolution possible : synthèse générée par IA
// ────────────────────────────────────────────────
// Pour remplacer genererSynthese() par un texte généré par un vrai
// modèle de langage (ex. Claude), il faudrait :
//   1. Créer une Edge Function Supabase qui reçoit les stats calculées
//      ci-dessus et appelle l'API Anthropic avec une clé stockée côté
//      serveur (jamais exposée au client).
//   2. Remplacer l'appel à genererSynthese() par un fetch vers cette
//      Edge Function, avec un fallback sur la version par règles en
//      cas d'échec réseau (pour ne jamais bloquer la génération du PDF).
// Ce n'est pas fait ici : la version par règles est déterministe,
// gratuite, instantanée et suffisante pour la majorité des besoins —
// à activer seulement si un vrai besoin de synthèse plus nuancée émerge.