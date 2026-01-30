/* js/facturation.js - LOGIQUE FACTURATION V2 */
import { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "./config.js";
import { logoBase64, chargerLogoBase64 } from "./utils.js"; 

// Variables Globales
let paiements = [];
let cacheDepenses = [];
let global_CA = 0;
let global_Depenses = 0;
const currentYear = new Date().getFullYear();

// ==========================================================================
// 1. INITIALISATION & NAVIGATION
// ==========================================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        chargerLogoBase64();
        window.chargerListeFactures();
        window.chargerDepenses();
        chargerSuggestionsClients();
    } else {
        window.location.href = "index.html"; // Retour login si pas connecté
    }
});

// Exposer les fonctions au HTML
window.switchTab = function(tab) {
    document.getElementById('tab-factures').classList.add('hidden');
    document.getElementById('tab-achats').classList.add('hidden');
    document.getElementById('btn-tab-factures').classList.remove('active');
    document.getElementById('btn-tab-achats').classList.remove('active');
    
    if(tab === 'factures') { document.getElementById('tab-factures').classList.remove('hidden'); document.getElementById('btn-tab-factures').classList.add('active'); }
    else { document.getElementById('tab-achats').classList.remove('hidden'); document.getElementById('btn-tab-achats').classList.add('active'); }
};

window.showDashboard = function() {
    document.getElementById('view-editor').classList.add('hidden');
    document.getElementById('view-dashboard').classList.remove('hidden');
    window.chargerListeFactures();
};

window.showEditor = function() {
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-editor').classList.remove('hidden');
};

// ==========================================================================
// 2. GESTION DES FACTURES (VENTES)
// ==========================================================================
window.chargerListeFactures = async function() {
    const tbody = document.getElementById('list-body'); 
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Chargement...</td></tr>';
    
    try {
        const q = query(collection(db, "factures_v2"), orderBy("date_creation", "desc")); 
        const querySnapshot = await getDocs(q);
        global_CA = 0; tbody.innerHTML = ""; 
        
        if(querySnapshot.empty) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Aucun document.</td></tr>'; return; }
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data(); 
            const dateDoc = new Date(data.date_creation); 
            const totalDoc = data.info?.total || 0; 
            const paye = data.paiements ? data.paiements.reduce((sum, p) => sum + p.montant, 0) : 0; 
            const reste = totalDoc - paye;
            const typeDoc = data.info?.type || 'DEVIS'; 
            
            if (typeDoc === "FACTURE" && dateDoc.getFullYear() === currentYear) { global_CA += totalDoc; } 
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="link-doc" onclick="window.chargerDocument('${docSnap.id}')" style="cursor:pointer; color:blue;"><strong>${data.info?.numero || '-'}</strong></td>
                <td>${dateDoc.toLocaleDateString()}</td>
                <td><span class="badge ${typeDoc === "FACTURE" ? "badge-facture" : "badge-devis"}" style="background:${typeDoc==='FACTURE'?'#dcfce7':'#eff6ff'}; padding:2px 8px; border-radius:4px;">${typeDoc}</span></td>
                <td><strong>${data.client?.nom || '-'}</strong></td>
                <td>${data.defunt?.nom || '-'}</td>
                <td style="text-align:right;">${totalDoc.toFixed(2)} €</td>
                <td style="text-align:right; color:${reste > 0.1 ? '#b91c1c' : '#15803d'}; font-weight:bold;">${reste.toFixed(2)} €</td>
                <td style="text-align:center;">
                    <button class="btn-icon" onclick="window.visualiserPDF('${docSnap.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" onclick="window.supprimerDocument('${docSnap.id}')" style="color:red;"><i class="fas fa-trash"></i></button>
                </td>`;
            tbody.appendChild(tr);
        });
        updateStats();
    } catch(e) { console.error(e); }
};

window.nouveauDocument = function() {
    document.getElementById('current_doc_id').value = "";
    document.getElementById('doc_numero').value = "Auto";
    document.getElementById('tbody_lignes').innerHTML = "";
    document.getElementById('doc_type').value = "DEVIS";
    document.getElementById('client_nom').value = "";
    document.getElementById('client_adresse').value = "";
    document.getElementById('defunt_nom').value = "";
    document.getElementById('doc_date').valueAsDate = new Date();
    
    paiements = []; 
    renderPaiements(); 
    calculTotal();
    window.showEditor();
};

window.ajouterLigne = function(desc="", prix=0, type="Courant") {
    const tr = document.createElement('tr');
    tr.className = "row-item";
    tr.innerHTML = `
        <td class="drag-handle"><i class="fas fa-grip-lines" style="color:#ccc;"></i></td>
        <td><input type="text" class="input-cell val-desc" value="${desc}" style="width:100%;"></td>
        <td><select class="input-cell val-type"><option value="Courant" ${type==='Courant'?'selected':''}>Courant</option><option value="Optionnel" ${type==='Optionnel'?'selected':''}>Optionnel</option></select></td>
        <td style="text-align:right;"><input type="number" class="input-cell val-prix" value="${prix}" oninput="window.calculTotal()" style="text-align:right;"></td>
        <td style="text-align:center;"><i class="fas fa-trash" style="color:red; cursor:pointer;" onclick="this.closest('tr').remove(); window.calculTotal();"></i></td>`;
    document.getElementById('tbody_lignes').appendChild(tr);
    window.calculTotal();
};

window.calculTotal = function() {
    let total = 0;
    document.querySelectorAll('.val-prix').forEach(i => total += parseFloat(i.value) || 0);
    document.getElementById('total_general').innerText = total.toFixed(2) + " €";
    document.getElementById('total_display').innerText = total.toFixed(2);
    
    let totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
    document.getElementById('total_paye').innerText = totalPaye.toFixed(2) + " €";
    document.getElementById('reste_a_payer').innerText = (total - totalPaye).toFixed(2) + " €";
};

window.sauvegarderDocument = async function() {
    try {
        const lignes = [];
        document.querySelectorAll('#tbody_lignes tr').forEach(tr => {
            const desc = tr.querySelector('.val-desc')?.value;
            if(desc) lignes.push({ desc: desc, type: 'item', prix: parseFloat(tr.querySelector('.val-prix').value)||0, cat: tr.querySelector('.val-type').value });
        });
        
        const docData = {
            client: { civility: document.getElementById('client_civility').value, nom: document.getElementById('client_nom').value, adresse: document.getElementById('client_adresse').value },
            defunt: { civility: document.getElementById('defunt_civility').value, nom: document.getElementById('defunt_nom').value },
            info: { type: document.getElementById('doc_type').value, date: document.getElementById('doc_date').value, numero: document.getElementById('doc_numero').value, total: parseFloat(document.getElementById('total_display').innerText) },
            lignes: lignes, paiements: paiements, date_creation: new Date().toISOString()
        };

        const id = document.getElementById('current_doc_id').value;
        if(id) await updateDoc(doc(db, "factures_v2", id), docData);
        else {
            const q = query(collection(db, "factures_v2")); const snap = await getDocs(q);
            docData.info.numero = (docData.info.type === 'DEVIS' ? 'D' : 'F') + '-' + currentYear + '-' + String(snap.size + 1).padStart(3, '0');
            await addDoc(collection(db, "factures_v2"), docData);
        }
        alert("✅ Enregistré !"); window.showDashboard();
    } catch(e) { alert("Erreur : " + e.message); }
};

window.supprimerDocument = async (id) => { if(confirm("Supprimer ?")) { await deleteDoc(doc(db, "factures_v2", id)); window.chargerListeFactures(); } };

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
        data.lignes.forEach(l => window.ajouterLigne(l.desc, l.prix, l.cat));
        paiements = data.paiements || []; renderPaiements(); window.calculTotal();
        window.showEditor();
    }
};

// ==========================================================================
// 3. PAIEMENTS
// ==========================================================================
window.ajouterPaiement = () => {
    const p = { date: document.getElementById('pay_date').value, mode: document.getElementById('pay_mode').value, montant: parseFloat(document.getElementById('pay_amount').value) };
    if(p.montant > 0) { paiements.push(p); renderPaiements(); window.calculTotal(); }
};

function renderPaiements() {
    const div = document.getElementById('liste_paiements'); div.innerHTML = "";
    paiements.forEach((p, i) => {
        div.innerHTML += `<div>${p.date} - ${p.mode}: <strong>${p.montant}€</strong> <i class="fas fa-trash" style="color:red;cursor:pointer;" onclick="window.supprimerPaiement(${i})"></i></div>`;
    });
}
window.supprimerPaiement = function(index) {
    paiements.splice(index, 1); renderPaiements(); window.calculTotal();
};

// ==========================================================================
// 4. GESTION DES ACHATS (DÉPENSES)
// ==========================================================================
window.chargerDepenses = async function() {
    const tbody = document.getElementById('depenses-body');
    try {
        const q = query(collection(db, "depenses"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        cacheDepenses = []; global_Depenses = 0;
        
        snap.forEach(docSnap => {
            const data = docSnap.data(); data.id = docSnap.id; cacheDepenses.push(data);
            const dDate = new Date(data.date);
            if(dDate.getFullYear() === currentYear && data.statut === 'Réglé') { global_Depenses += (data.montant || 0); }
        });
        updateStats(); window.filtrerDepenses();
    } catch(e) { console.error(e); }
};

window.gererDepense = async function() {
    const id = document.getElementById('dep_edit_id').value;
    const data = {
        date: document.getElementById('dep_date_fac').value,
        reference: document.getElementById('dep_ref').value,
        fournisseur: document.getElementById('dep_fourn').value,
        details: document.getElementById('dep_details').value,
        categorie: document.getElementById('dep_cat').value,
        mode: document.getElementById('dep_mode').value,
        statut: document.getElementById('dep_statut').value,
        montant: parseFloat(document.getElementById('dep_montant').value) || 0,
        date_reglement: document.getElementById('dep_date_reg').value
    };
    if(!data.date || !data.fournisseur || data.montant <= 0) return alert("Champs obligatoires manquants.");
    
    try {
        if(id) await updateDoc(doc(db, "depenses", id), data);
        else { data.date_ajout = new Date().toISOString(); await addDoc(collection(db, "depenses"), data); }
        document.getElementById('dep_form').reset(); document.getElementById('dep_edit_id').value=""; 
        window.chargerDepenses();
    } catch(e) { alert(e.message); }
};

window.filtrerDepenses = function() {
    const term = document.getElementById('search_depense').value.toLowerCase();
    const tbody = document.getElementById('depenses-body'); tbody.innerHTML = "";
    
    cacheDepenses.filter(d => (d.fournisseur+d.details+d.categorie).toLowerCase().includes(term)).forEach(data => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(data.date).toLocaleDateString()}</td>
            <td><strong>${data.fournisseur}</strong><br><small>${data.categorie}</small></td>
            <td>${data.reference || '-'}</td>
            <td><span class="badge" style="background:${data.statut==='Réglé'?'#dcfce7':'#fee2e2'};">${data.statut}</span></td>
            <td style="text-align:right; font-weight:bold; color:#b91c1c;">- ${data.montant.toFixed(2)} €</td>
            <td style="text-align:center;">
                <button class="btn-icon" onclick="window.preparerModification('${data.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="window.supprimerDepense('${data.id}')" style="color:red;"><i class="fas fa-trash"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
};

window.preparerModification = (id) => { const d = cacheDepenses.find(x=>x.id===id); if(d) { document.getElementById('dep_edit_id').value=id; document.getElementById('dep_fourn').value=d.fournisseur; document.getElementById('dep_montant').value=d.montant; document.getElementById('dep_date_fac').value=d.date; document.getElementById('dep_ref').value=d.reference; } };
window.supprimerDepense = async (id) => { if(confirm("Supprimer ?")) { await deleteDoc(doc(db,"depenses",id)); window.chargerDepenses(); } };

// ==========================================================================
// 5. PDF GENERATOR
// ==========================================================================
window.imprimerDocumentActuel = function() {
    const lignes = [];
    document.querySelectorAll('#tbody_lignes tr').forEach(tr => {
        lignes.push({ desc: tr.querySelector('.val-desc').value, type: 'item', prix: parseFloat(tr.querySelector('.val-prix').value)||0, cat: tr.querySelector('.val-type').value });
    });
    const data = {
        client: { civility: document.getElementById('client_civility').value, nom: document.getElementById('client_nom').value, adresse: document.getElementById('client_adresse').value },
        defunt: { civility: document.getElementById('defunt_civility').value, nom: document.getElementById('defunt_nom').value },
        info: { type: document.getElementById('doc_type').value, date: document.getElementById('doc_date').value, numero: document.getElementById('doc_numero').value, total: parseFloat(document.getElementById('total_display').innerText) },
        lignes: lignes, paiements: paiements
    };
    generatePDFFromData(data);
};

window.visualiserPDF = async (id) => { const d = await getDoc(doc(db,"factures_v2",id)); if(d.exists()) generatePDFFromData(d.data()); };

function generatePDFFromData(data) {
    if(!logoBase64) chargerLogoBase64();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    if (logoBase64) { try { doc.addImage(logoBase64,'PNG', 15, 10, 25, 25); } catch(e){} }
    const green = [34, 155, 76];
    
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...green);
    doc.text("POMPES FUNEBRES", 15, 40); doc.text("SOLIDAIRE PERPIGNAN", 15, 45);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(80);
    doc.text("32 boulevard Léon Jean Grégory Thuir", 15, 50); doc.text("Tél : 07.55.18.27.77", 15, 54);

    doc.setFillColor(245, 245, 245); doc.roundedRect(110, 10, 85, 30, 2, 2, 'F');
    doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica","bold");
    doc.text(`${data.client.civility || ''} ${data.client.nom || ''}`, 115, 18);
    doc.setFont("helvetica","normal"); doc.setFontSize(9);
    doc.text(doc.splitTextToSize(data.client.adresse || "", 80), 115, 24);

    let y = 65; doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...green);
    doc.text(`${data.info.type} N° ${data.info.numero}`, 15, y);
    
    doc.setTextColor(0); doc.setFont("helvetica","normal"); doc.setFontSize(10);
    const dateStr = data.info.date ? data.info.date.split('-').reverse().join('/') : "";
    doc.text(`du ${dateStr}`, 90, y);
    doc.setFont("helvetica","bold"); 
    doc.text(`DÉFUNT : ${data.defunt.civility || ''} ${data.defunt.nom || ''}`, 130, y); 
    y += 8;

    const rows = [];
    if(data.lignes) {
        data.lignes.forEach(l => {
            const prix = parseFloat(l.prix).toFixed(2) + ' €';
            rows.push([l.desc, 'NA', l.cat === 'Optionnel' ? '' : prix, l.cat === 'Optionnel' ? prix : '']);
        });
    }
    
    doc.autoTable({
        startY: y, head: [['DÉSIGNATION', 'TVA', 'PRESTATIONS\nCOURANTES', 'PRESTATIONS\nOPTIONNELLES']], body: rows, theme: 'grid',
        headStyles: { fillColor: [230, 230, 230], textColor: [0,0,0], fontSize: 8, halign: 'center', lineColor: [200, 200, 200], lineWidth: 0.1 },
        styles: { fontSize: 8, cellPadding: 1.5 }, columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
    });
    
    let curY = doc.lastAutoTable.finalY + 5;
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

    doc.setDrawColor(...green); doc.setLineWidth(0.5); doc.rect(138, yReste - 5, 58, 10);
    doc.setTextColor(...green); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("RESTE À PAYER :", 140, yReste + 2); 
    doc.text(reste.toFixed(2) + " €", 193, yReste + 2, {align:'right'});

    window.open(doc.output('bloburl'), '_blank');
}

function updateStats() {
    document.getElementById('stat-ca').innerText = global_CA.toFixed(2) + " €";
    document.getElementById('stat-depenses').innerText = global_Depenses.toFixed(2) + " €";
    const res = global_CA - global_Depenses;
    const el = document.getElementById('stat-resultat');
    el.innerText = res.toFixed(2) + " €";
    el.style.color = res >= 0 ? '#1e40af' : '#b91c1c';
}

async function chargerSuggestionsClients() { 
    try {
        const q = query(collection(db, "dossiers_admin"), orderBy("date_creation", "desc"));
        const snap = await getDocs(q);
        const dl = document.getElementById('clients_suggestions'); dl.innerHTML = "";
        snap.forEach(doc => { if(doc.data().mandant?.nom) dl.innerHTML += `<option value="${doc.data().mandant.nom}">`; });
    } catch(e){} 
}
