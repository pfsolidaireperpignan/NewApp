/* js/facturation.js - Logique Facturation (Extracted) */
import { db, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, auth } from "./config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { logoBase64, chargerLogoBase64 } from "./utils.js"; 

// --- SÉCURITÉ ---
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "index.html";
    else {
        chargerLogoBase64();
        window.chargerListeFactures();
        window.chargerDepenses();
        chargerSuggestionsClients();
        if(document.getElementById('dep_date_fac')) document.getElementById('dep_date_fac').valueAsDate = new Date();
    }
});

// --- VARIABLES GLOBALES ---
let paiements = [];
let cacheDepenses = [];
let global_CA = 0;
let global_Depenses = 0;
const currentYear = new Date().getFullYear();
let currentSort = { col: 'date', order: 'desc' };

// --- PDF ENGINE (AVEC LA COULEUR VERTE CORRIGÉE) ---
window.generatePDFFromData = function(data, saveMode = false) {
    if(!logoBase64) chargerLogoBase64();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    if (logoBase64) { try { doc.addImage(logoBase64,'PNG', 15, 10, 25, 25); } catch(e){} }
    
    // !!! ICI LA COULEUR VERTE RESTAURÉE !!!
    const greenColor = [34, 155, 76]; 
    
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...greenColor);
    doc.text("POMPES FUNEBRES", 15, 40); doc.text("SOLIDAIRE PERPIGNAN", 15, 45);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(80);
    doc.text("32 boulevard Léon Jean Grégory Thuir", 15, 50); doc.text("Tél : 07.55.18.27.77", 15, 54);

    doc.setFillColor(245, 245, 245); doc.roundedRect(110, 10, 85, 30, 2, 2, 'F');
    doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica","bold");
    doc.text(`${data.client.civility || ''} ${data.client.nom || ''}`, 115, 18);
    doc.setFont("helvetica","normal"); doc.setFontSize(9);
    doc.text(doc.splitTextToSize(data.client.adresse || "", 80), 115, 24);

    let y = 65; doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...greenColor);
    const typeDoc = data.info.type || "DOCUMENT";
    const numDoc = data.info.numero || "";
    doc.text(`${typeDoc} N° ${numDoc}`, 15, y); 
    
    doc.setTextColor(0); doc.setFont("helvetica","normal"); doc.setFontSize(10);
    const dateStr = data.info.date ? data.info.date.split('-').reverse().join('/') : "";
    doc.text(`du ${dateStr}`, 90, y); 
    doc.setFont("helvetica","bold"); 
    doc.text(`DÉFUNT : ${data.defunt.civility || ''} ${data.defunt.nom || ''}`, 130, y); 
    y += 8;

    const rows = [];
    if(data.lignes) {
        data.lignes.forEach(l => {
            if(l.type === 'section') {
                rows.push([{ content: (l.text || "").toUpperCase(), colSpan: 4, styles: { fillColor: [255, 228, 196], textColor: [0,0,0], fontStyle: 'bold', fontSize: 8 } }]);
            } else {
                const prix = parseFloat(l.prix).toFixed(2) + ' €';
                rows.push([l.desc, 'NA', l.cat === 'Optionnel' ? '' : prix, l.cat === 'Optionnel' ? prix : '']);
            }
        });
    }
    
    doc.autoTable({
        startY: y, 
        head: [['DÉSIGNATION', 'TVA', 'PRESTATIONS\nCOURANTES', 'PRESTATIONS\nOPTIONNELLES']], 
        body: rows, 
        theme: 'grid',
        headStyles: { fillColor: [230, 230, 230], textColor: [0,0,0], fontSize: 8, halign: 'center', lineColor: [200, 200, 200], lineWidth: 0.1 },
        styles: { fontSize: 8, cellPadding: 1.5 }, 
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
    });
    
    const finalY = doc.lastAutoTable.finalY + 5;
    let curY = finalY;

    const total = parseFloat(data.info.total) || 0;
    const dejaRegle = data.paiements ? data.paiements.reduce((sum, p) => sum + p.montant, 0) : 0;
    const reste = total - dejaRegle;

    doc.setFontSize(9); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text("Total TTC :", 140, curY + 5); 
    doc.text(total.toFixed(2) + " €", 195, curY + 5, {align:'right'}); 
    
    let yReste = curY + 12;
    if(data.paiements && data.paiements.length > 0) {
        let yPay = curY + 10;
        doc.setFontSize(8); doc.setTextColor(100); doc.setFont("helvetica", "normal");
        data.paiements.forEach(p => {
            const dateP = p.date ? new Date(p.date).toLocaleDateString() : "";
            doc.text(`Reçu le ${dateP} (${p.mode}) :`, 140, yPay);
            doc.text(`- ${parseFloat(p.montant).toFixed(2)} €`, 195, yPay, {align:'right'});
            yPay += 4;
        });
        yReste = yPay + 5;
    }

    doc.setDrawColor(...greenColor); doc.setLineWidth(0.5); doc.rect(138, yReste - 5, 58, 10);
    doc.setTextColor(...greenColor); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("RESTE À PAYER :", 140, yReste + 2); 
    doc.text(reste.toFixed(2) + " €", 193, yReste + 2, {align:'right'});

    if (saveMode) { doc.save(`${typeDoc}_${numDoc}.pdf`); } else { window.open(doc.output('bloburl'), '_blank'); }
};

// --- NAVIGATION UI ---
window.switchTab = function(tab) {
    document.getElementById('tab-factures').classList.add('hidden');
    document.getElementById('tab-achats').classList.add('hidden');
    document.getElementById('btn-tab-factures').classList.remove('active');
    document.getElementById('btn-tab-achats').classList.remove('active');
    document.getElementById('btn-tab-achats').classList.remove('active-red');
    
    if(tab === 'factures') { document.getElementById('tab-factures').classList.remove('hidden'); document.getElementById('btn-tab-factures').classList.add('active'); }
    else { document.getElementById('tab-achats').classList.remove('hidden'); document.getElementById('btn-tab-achats').classList.add('active-red'); window.chargerDepenses(); }
};

window.showDashboard = function() {
    document.getElementById('view-editor').classList.add('hidden');
    document.getElementById('view-dashboard').classList.remove('hidden');
    window.chargerListeFactures();
};

window.nouveauDocument = function() {
    document.getElementById('current_doc_id').value = "";
    document.getElementById('doc_numero').value = "Auto";
    document.getElementById('client_nom').value = ""; document.getElementById('client_adresse').value = "";
    document.getElementById('defunt_nom').value = ""; document.getElementById('doc_date').valueAsDate = new Date();
    document.getElementById('doc_type').value = "DEVIS"; document.getElementById('tbody_lignes').innerHTML = "";
    paiements = []; window.renderPaiements(); window.calculTotal();
    document.getElementById('btn-transform').classList.add('hidden');
    document.getElementById('view-dashboard').classList.add('hidden'); document.getElementById('view-editor').classList.remove('hidden');
};

// --- LOGIQUE FACTURES ---
window.chargerListeFactures = async function() {
    const tbody = document.getElementById('list-body'); tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Chargement...</td></tr>';
    try {
        const q = query(collection(db, "factures_v2"), orderBy("date_creation", "desc"));
        const querySnapshot = await getDocs(q);
        global_CA = 0; tbody.innerHTML = ""; 
        if(querySnapshot.empty) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Aucun document.</td></tr>'; return; }
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data(); const dateDoc = new Date(data.date_creation); 
            const totalDoc = data.info?.total || 0; 
            const paye = data.paiements ? data.paiements.reduce((sum, p) => sum + p.montant, 0) : 0; 
            const reste = totalDoc - paye;
            const typeDoc = data.info?.type || 'DEVIS'; 
            if (typeDoc === "FACTURE" && dateDoc.getFullYear() === currentYear) { global_CA += totalDoc; } 
            
            const typeClass = (typeDoc === "FACTURE") ? "badge-facture" : "badge-devis";
            const nomClient = (data.client?.civility||"") + " " + (data.client?.nom || '-');
            const numDoc = data.info?.numero || '-';
            const linkClient = `index.html?recherche=${encodeURIComponent(data.client?.nom || '')}`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="link-doc" onclick="window.chargerDocument('${docSnap.id}')" title="Modifier/Imprimer"><strong>${numDoc}</strong></td>
                <td>${dateDoc.toLocaleDateString()}</td>
                <td><span class="badge ${typeClass}">${typeDoc}</span></td>
                <td class="link-client" onclick="window.location.href='${linkClient}'" title="Voir Dossier Client"><strong>${nomClient}</strong></td>
                <td>${data.defunt?.nom || '-'}</td>
                <td style="text-align:right; font-weight:bold;">${totalDoc.toFixed(2)} €</td>
                <td style="text-align:right; font-weight:bold; color:${reste > 0 ? '#b91c1c' : '#15803d'};">${reste.toFixed(2)} €</td>
                <td style="text-align:center; white-space:nowrap;">
                    <button class="btn-icon" style="color:#3b82f6; border:none; background:none; cursor:pointer; font-size:1.1rem; margin-right:10px;" onclick="window.visualiserPDF('${docSnap.id}')" title="Visualiser PDF"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" style="color:#ef4444; border:none; background:none; cursor:pointer; font-size:1.1rem;" onclick="window.supprimerDocument('${docSnap.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </td>`;
            tbody.appendChild(tr);
        });
        window.chargerDepenses();
    } catch(e) { console.error(e); tbody.innerHTML = `<tr><td colspan="8" style="color:red;">Erreur : ${e.message}</td></tr>`; }
};

window.chargerDocument = async (id) => { 
    const d = await getDoc(doc(db,"factures_v2",id)); 
    if(d.exists()) {
        const data = d.data();
        document.getElementById('current_doc_id').value = id;
        document.getElementById('doc_numero').value = data.info.numero;
        document.getElementById('client_nom').value = data.client.nom;
        document.getElementById('client_adresse').value = data.client.adresse;
        document.getElementById('defunt_nom').value = data.defunt.nom;
        document.getElementById('doc_type').value = data.info.type;
        document.getElementById('doc_date').value = data.info.date;
        document.getElementById('tbody_lignes').innerHTML = "";
        data.lignes.forEach(l => { if(l.type==='section') window.ajouterSection(l.text); else window.ajouterLigne(l.desc, l.prix, l.cat); });
        paiements = data.paiements || []; window.renderPaiements(); window.calculTotal();
        document.getElementById('btn-transform').classList.toggle('hidden', data.info.type !== 'DEVIS');
        document.getElementById('view-dashboard').classList.add('hidden'); document.getElementById('view-editor').classList.remove('hidden');
    }
};

window.ajouterLigne = function(desc="", prix=0, type="Courant") {
    const tr = document.createElement('tr'); tr.className = "row-item";
    tr.innerHTML = `<td class="drag-handle"><i class="fas fa-grip-lines"></i></td><td><input type="text" class="input-cell val-desc" value="${desc}"></td><td><select class="input-cell val-type" style="border:none;"><option value="Courant" ${type==='Courant'?'selected':''}>Courant</option><option value="Optionnel" ${type==='Optionnel'?'selected':''}>Optionnel</option><option value="Avance" ${type==='Avance'?'selected':''}>Avance</option></select></td><td>NA</td><td><input type="number" class="input-cell price-cell val-prix" value="${prix}" oninput="window.calculTotal()"></td><td style="text-align:center;"><i class="fas fa-trash" style="color:#ef4444; cursor:pointer;" onclick="this.closest('tr').remove(); window.calculTotal();"></i></td>`;
    document.getElementById('tbody_lignes').appendChild(tr); window.calculTotal();
};
window.ajouterSection = function(titre="NOUVELLE SECTION") { const tr = document.createElement('tr'); tr.className = "row-section"; tr.innerHTML = `<td class="drag-handle"><i class="fas fa-grip-vertical"></i></td><td colspan="4"><input type="text" class="input-cell input-section" value="${titre}"></td><td style="text-align:center;"><i class="fas fa-trash" style="color:#ef4444; cursor:pointer;" onclick="this.closest('tr').remove(); window.calculTotal();"></i></td>`; document.getElementById('tbody_lignes').appendChild(tr); };

window.calculTotal = function() {
    let total = 0; document.querySelectorAll('.val-prix').forEach(i => total += parseFloat(i.value) || 0);
    document.getElementById('total_general').innerText = total.toFixed(2) + " €";
    document.getElementById('total_display').innerText = total.toFixed(2);
    let totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
    document.getElementById('total_paye').innerText = totalPaye.toFixed(2) + " €";
    document.getElementById('reste_a_payer').innerText = (total - totalPaye).toFixed(2) + " €";
};

window.sauvegarderDocument = async function() {
    const lignes = [];
    document.querySelectorAll('#tbody_lignes tr').forEach(tr => {
        if(tr.classList.contains('row-section')) lignes.push({ type: 'section', text: tr.querySelector('input').value });
        else lignes.push({ type: 'item', desc: tr.querySelector('.val-desc').value, cat: tr.querySelector('.val-type').value, prix: parseFloat(tr.querySelector('.val-prix').value)||0 });
    });
    const docData = {
        client: { civility: document.getElementById('client_civility').value, nom: document.getElementById('client_nom').value, adresse: document.getElementById('client_adresse').value },
        defunt: { civility: document.getElementById('defunt_civility').value, nom: document.getElementById('defunt_nom').value },
        info: { type: document.getElementById('doc_type').value, date: document.getElementById('doc_date').value, numero: document.getElementById('doc_numero').value, total: parseFloat(document.getElementById('total_display').innerText) },
        lignes: lignes, paiements: paiements, date_creation: new Date().toISOString()
    };
    const id = document.getElementById('current_doc_id').value;
    try {
        if(id) await updateDoc(doc(db, "factures_v2", id), docData);
        else { 
            const q = query(collection(db, "factures_v2")); const snap = await getDocs(q);
            const count = snap.size + 1; const year = new Date().getFullYear(); const prefix = (docData.info.type === 'DEVIS') ? 'D' : 'F';
            docData.info.numero = `${prefix}-${year}-${String(count).padStart(3, '0')}`;
            await addDoc(collection(db, "factures_v2"), docData);
        }
        alert("✅ Enregistré !"); window.showDashboard();
    } catch(e) { alert("Erreur : " + e.message); }
};

window.ajouterPaiement = () => { const p = { date: document.getElementById('pay_date').value, mode: document.getElementById('pay_mode').value, montant: parseFloat(document.getElementById('pay_amount').value) }; if(p.montant > 0) { paiements.push(p); window.renderPaiements(); window.calculTotal(); } };
window.supprimerPaiement = (index) => { paiements.splice(index, 1); window.renderPaiements(); window.calculTotal(); };
window.renderPaiements = () => { const div = document.getElementById('liste_paiements'); div.innerHTML = ""; paiements.forEach((p, i) => { div.innerHTML += `<div>${p.date} - ${p.mode}: <strong>${p.montant}€</strong> <i class="fas fa-trash" style="color:red;cursor:pointer;" onclick="window.supprimerPaiement(${i})"></i></div>`; }); };

// --- ACHATS & STATS ---
window.chargerDepenses = async function() {
    const tbody = document.getElementById('depenses-body');
    try {
        const q = query(collection(db, "depenses"), orderBy("date", "desc")); const snap = await getDocs(q);
        cacheDepenses = []; global_Depenses = 0;
        snap.forEach(docSnap => { const data = docSnap.data(); data.id = docSnap.id; cacheDepenses.push(data); if(new Date(data.date).getFullYear() === currentYear && data.statut === 'Réglé') global_Depenses += (data.montant || 0); });
        updateFinancialDashboard(); window.filtrerDepenses();
    } catch(e) { console.error(e); }
};
window.filtrerDepenses = function() {
    const term = document.getElementById('search_depense').value.toLowerCase();
    const tbody = document.getElementById('depenses-body'); tbody.innerHTML = "";
    cacheDepenses.filter(d => (d.fournisseur+d.details+d.categorie).toLowerCase().includes(term)).forEach(data => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${new Date(data.date).toLocaleDateString()}</td><td><strong>${data.fournisseur}</strong><br><small>${data.categorie}</small></td><td>${data.reference || '-'}</td><td><span class="badge ${data.statut==='Réglé'?'badge-regle':'badge-attente'}">${data.statut}</span></td><td style="text-align:right; font-weight:bold; color:#b91c1c;">- ${data.montant.toFixed(2)} €</td><td style="text-align:center;"><button class="btn-icon" onclick="window.supprimerDepense('${data.id}')"><i class="fas fa-trash" style="color:red;"></i></button></td>`;
        tbody.appendChild(tr);
    });
};
window.gererDepense = async function() { 
    const id = document.getElementById('dep_edit_id').value;
    const data = { date: document.getElementById('dep_date_fac').value, reference: document.getElementById('dep_ref').value, fournisseur: document.getElementById('dep_fourn').value, details: document.getElementById('dep_details').value, categorie: document.getElementById('dep_cat').value, mode: document.getElementById('dep_mode').value, statut: document.getElementById('dep_statut').value, montant: parseFloat(document.getElementById('dep_montant').value) || 0, date_reglement: document.getElementById('dep_date_reg').value };
    if(!data.date || !data.fournisseur) return alert("Champs obligatoires manquants.");
    try { if(id) await updateDoc(doc(db, "depenses", id), data); else { data.date_ajout = new Date().toISOString(); await addDoc(collection(db, "depenses"), data); } window.resetFormDepense(); window.chargerDepenses(); } catch(e){alert(e.message);}
};
window.resetFormDepense = function() { document.getElementById('dep_edit_id').value = ""; document.getElementById('form-depense').reset(); document.getElementById('btn-action-depense').innerHTML="SAUVER"; document.getElementById('btn-cancel-depense').classList.add('hidden'); };
window.preparerModification = function(id) { 
    const d = cacheDepenses.find(x=>x.id===id); if(d) { 
        document.getElementById('dep_edit_id').value=id; document.getElementById('dep_date_fac').value=d.date; document.getElementById('dep_ref').value=d.reference; document.getElementById('dep_fourn').value=d.fournisseur; document.getElementById('dep_montant').value=d.montant; document.getElementById('dep_cat').value=d.categorie; 
        document.getElementById('btn-action-depense').innerHTML="MODIFIER"; document.getElementById('btn-cancel-depense').classList.remove('hidden');
    } 
};
window.supprimerDepense = async (id) => { if(confirm("Supprimer ?")) { await deleteDoc(doc(db,"depenses",id)); window.chargerDepenses(); } };
window.supprimerDocument = async (id) => { if(confirm("Supprimer ?")) { await deleteDoc(doc(db,"factures_v2",id)); window.chargerListeFactures(); } };
window.visualiserPDF = async (id) => { const d = await getDoc(doc(db,"factures_v2",id)); if(d.exists()) window.generatePDFFromData(d.data()); };

function updateFinancialDashboard() {
    document.getElementById('stat-ca').innerText = global_CA.toFixed(2) + " €";
    document.getElementById('stat-depenses').innerText = global_Depenses.toFixed(2) + " €";
    const res = global_CA - global_Depenses;
    const el = document.getElementById('stat-resultat');
    el.innerText = res.toFixed(2) + " €";
    el.style.color = res >= 0 ? '#1e40af' : '#b91c1c';
}
async function chargerSuggestionsClients() { try { const q = query(collection(db, "dossiers_admin"), orderBy("date_creation", "desc")); const snap = await getDocs(q); const dl = document.getElementById('clients_suggestions'); dl.innerHTML = ""; snap.forEach(doc => { if(doc.data().mandant?.nom) dl.innerHTML += `<option value="${doc.data().mandant.nom}">`; }); } catch(e){} }

// PDF Button Binding
window.imprimerDocumentActuel = function() { document.getElementById('btn-pdf').click(); };
window.toggleSidebar = function() {
    const sb = document.querySelector('.sidebar');
    if(window.innerWidth < 768) { sb.classList.toggle('mobile-open'); document.getElementById('mobile-overlay').style.display = sb.classList.contains('mobile-open') ? 'block' : 'none'; } else { sb.classList.toggle('collapsed'); }
};
window.trierTableau = function(col) { if (currentSort.col === col) { currentSort.order = (currentSort.order === 'asc') ? 'desc' : 'asc'; } else { currentSort.col = col; currentSort.order = 'asc'; } window.filtrerDepenses(); };
