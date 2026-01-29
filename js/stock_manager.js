/* Fichier : js/stock_manager.js */
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from './config.js';

// --- CHARGER LE STOCK ---
export async function chargerStock() {
    const container = document.getElementById('stock-grid');
    if(!container) return;
    container.innerHTML = '<div style="grid-column:span 3; text-align:center;">Chargement du stock...</div>';

    try {
        const q = query(collection(db, "stock"), orderBy("nom"));
        const snapshot = await getDocs(q);
        
        container.innerHTML = "";
        
        if(snapshot.empty) {
            container.innerHTML = '<div style="grid-column:span 3; text-align:center; color:#888;">Stock vide. Ajoutez des articles.</div>';
            return;
        }

        snapshot.forEach(docSnap => {
            const item = docSnap.data();
            // Couleur selon la quantité
            let colorClass = "bg-white";
            if(item.qte <= 2) colorClass = "bg-red-50 border-red-200"; // Alerte rupture

            const div = document.createElement('div');
            div.className = `card ${colorClass}`;
            div.style.marginBottom = "0"; // Override style global
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <h4 style="margin:0; font-size:1.1rem; color:#1e293b;">${item.nom}</h4>
                        <div style="font-size:0.9rem; color:#64748b; margin-top:5px;">${item.categorie}</div>
                        <div style="font-weight:bold; font-size:1.5rem; margin-top:10px; color:${item.qte > 2 ? '#10b981' : '#ef4444'};">
                            ${item.qte} <span style="font-size:0.9rem; font-weight:normal;">en stock</span>
                        </div>
                    </div>
                    <button onclick="window.supprimerArticle('${docSnap.id}')" class="btn-icon" style="color:#ef4444; border:none; background:transparent;"><i class="fas fa-times"></i></button>
                </div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button class="btn btn-green" style="padding:5px 15px; flex:1;" onclick="window.mouvementStock('${docSnap.id}', 1, ${item.qte})"><i class="fas fa-plus"></i></button>
                    <button class="btn btn-red" style="padding:5px 15px; flex:1;" onclick="window.mouvementStock('${docSnap.id}', -1, ${item.qte})"><i class="fas fa-minus"></i></button>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (e) {
        container.innerHTML = `<div style="color:red">Erreur stock : ${e.message}</div>`;
    }
}

// --- MOUVEMENT (+1 / -1) ---
export async function mouvementStock(id, delta, qteActuelle) {
    const newQte = parseInt(qteActuelle) + delta;
    if(newQte < 0) return alert("Stock ne peut pas être négatif.");
    
    try {
        await updateDoc(doc(db, "stock", id), { qte: newQte });
        chargerStock(); // Rafraichir l'affichage
    } catch (e) {
        alert("Erreur mise à jour : " + e.message);
    }
}

// --- AJOUTER NOUVEL ARTICLE ---
export async function ajouterArticle() {
    const nom = prompt("Nom de l'article (ex: Cercueil Chêne) :");
    if(!nom) return;
    const cat = prompt("Catégorie (ex: Cercueils, Urnes...) :") || "Divers";
    const qte = parseInt(prompt("Quantité initiale :") || "0");

    try {
        await addDoc(collection(db, "stock"), {
            nom: nom,
            categorie: cat,
            qte: qte,
            date_ajout: new Date().toISOString()
        });
        chargerStock();
    } catch (e) {
        alert("Erreur ajout : " + e.message);
    }
}

// --- SUPPRIMER ARTICLE ---
export async function supprimerArticle(id) {
    if(confirm("Supprimer définitivement cet article du stock ?")) {
        await deleteDoc(doc(db, "stock", id));
        chargerStock();
    }
}