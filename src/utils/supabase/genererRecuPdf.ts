import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { formatMontant } from '../../lib/utils';

export interface DonneesRecu {
  numero_recu: string;
  reference:   string;
  montant:     number;
  devise?:     string;
  operateur:   string;
  type:        string;
  date:        string | Date;
  tontine_nom: string;
  membre_nom:  string;
  membre_prenom: string;
}

const OPERATEUR_LABEL: Record<string, string> = {
  mtn:    'MTN Mobile Money',
  orange: 'Orange Money',
  camtel: 'Camtel Mobile Money',
};

export async function genererRecuPdf(recu: DonneesRecu): Promise<void> {
  const baseUrl = (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin;
  const urlVerification = `${baseUrl}/verifier/${recu.numero_recu}`;

  // QR code encodé en data URL
  const qrDataUrl = await QRCode.toDataURL(urlVerification, {
    width: 200,
    margin: 1,
    color: { dark: '#1e293b', light: '#ffffff' },
  });

  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // En-tête
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('TontineDigitale', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Reçu de paiement', pageWidth / 2, y, { align: 'center' });

  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  // Numéro de reçu en évidence
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('N° DE REÇU', 15, y);
  y += 5;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(recu.numero_recu, 15, y);
  y += 12;

  // Détails
  const lignes: [string, string][] = [
    ['Tontine',        recu.tontine_nom],
    ['Membre',         `${recu.membre_prenom} ${recu.membre_nom}`],
    ['Opérateur',      OPERATEUR_LABEL[recu.operateur] ?? recu.operateur],
    ['Type',           recu.type === 'depot' ? 'Cotisation (dépôt)' : 'Retrait'],
    ['Référence transaction', recu.reference],
    ['Date',           new Date(recu.date).toLocaleString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })],
  ];

  doc.setFontSize(10);
  for (const [label, val] of lignes) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(val, pageWidth - 15, y, { align: 'right' });
    y += 7;
  }

  y += 4;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, y, pageWidth - 30, 16, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text('MONTANT PAYÉ', 20, y + 6);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMontant(recu.montant, recu.devise as any), 20, y + 12.5);

  y += 26;

  // QR code + mention de vérification
  const qrSize = 26;
  doc.addImage(qrDataUrl, 'PNG', 15, y, qrSize, qrSize);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const texteVerif = doc.splitTextToSize(
    "Ce reçu est signé électroniquement et vérifiable en ligne. " +
    "Scannez le QR code ou consultez le lien ci-dessous pour confirmer son authenticité.",
    pageWidth - 30 - qrSize - 5
  );
  doc.text(texteVerif, 15 + qrSize + 5, y + 5);
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text(urlVerification, 15 + qrSize + 5, y + 22, { maxWidth: pageWidth - 30 - qrSize - 5 });

  // Pied de page
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Document généré automatiquement — TontineDigitale',
    pageWidth / 2, doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  doc.save(`recu-${recu.numero_recu}.pdf`);
}
