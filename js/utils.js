/* Fichier : js/utils.js - VERSION GOLD */

// 1. Récupère la valeur d'un input HTML (ou vide si n'existe pas)
export function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

// 2. Formate un nombre en Euros (Ex: 1050.5 -> "1 050,50 €")
export function formatMoney(amount) {
    if (isNaN(amount)) return "0,00 €";
    return parseFloat(amount).toLocaleString('fr-FR', { 
        style: 'currency', 
        currency: 'EUR' 
    });
}

// 3. Formate une date (Ex: 2026-01-20 -> "20/01/2026")
export function formatDateFR(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('fr-FR');
}
/* Fichier : js/utils.js */
export let logoBase64 = null;

// Convertit l'image HTML en Base64 pour les PDF
export function chargerLogoBase64() {
    const img = document.getElementById('logo-source');
    if (img && img.naturalWidth > 0) {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        try { logoBase64 = c.toDataURL("image/png"); } catch (e) { console.warn("Erreur logo:", e); }
    }
}

// Récupère la valeur d'un input par son ID
export function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

// Formate une date YYYY-MM-DD en DD/MM/YYYY
export function formatDate(d) {
    return d ? d.split("-").reverse().join("/") : ".................";
}

// Ajoute le filigrane (Logo en fond)
export function ajouterFiligrane(pdf) {
    if (logoBase64) {
        try {
            pdf.saveGraphicsState();
            pdf.setGState(new pdf.GState({ opacity: 0.06 }));
            pdf.addImage(logoBase64, 'PNG', 55, 98, 100, 100);
            pdf.restoreGraphicsState();
        } catch (e) {}
    }
}

// En-tête standard PF Solidaire
export function headerPF(pdf, y = 20) {
    pdf.setFont("helvetica", "bold"); pdf.setTextColor(34, 155, 76); pdf.setFontSize(12);
    pdf.text("POMPES FUNEBRES SOLIDAIRE PERPIGNAN", 105, y, { align: "center" });
    pdf.setTextColor(80); pdf.setFontSize(8); pdf.setFont("helvetica", "normal");
    pdf.text("32 boulevard Léon Jean Grégory Thuir - TEL : 07.55.18.27.77", 105, y + 5, { align: "center" });
    pdf.text("HABILITATION N° : 23-66-0205 | SIRET : 53927029800042", 105, y + 9, { align: "center" });
    pdf.setDrawColor(34, 155, 76); pdf.setLineWidth(0.5); pdf.line(40, y + 12, 170, y + 12);
}