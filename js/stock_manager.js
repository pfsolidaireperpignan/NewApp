/* Fichier : js/stock_manager.js */
import { db } from './config.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CHARGER LE STOCK ---
export async function chargerStock() {
    const container = document.getElementById('stock-table-body'); // Adapte à votre tableau HTML (table body)
    if(!container) return;
    container.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';

    try {
        const q = query(collection(db, "stock_articles"), orderBy("nom"));
        const snapshot = await getDocs(q);
        
        container.innerHTML = "";
        
        if(snapshot.empty) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Stock vide.</td></tr>';
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            // Logique d'affichage adaptée à votre tableau HTML
            tr.innerHTML = `
                <td><strong>${data.nom}</strong></td>
                <td>${data.categorie || '-'}</td>
                <td>${data.prix_achat || 0} €</td>
                <td>${data.prix_vente || 0} €</td>
                <td style="font-weight:bold; color:${data.qte < 3 ? 'red' : 'green'}">${data.qte}</td>
                <td>
                    <button class="btn-icon" onclick="window.mouvementStock('${docSnap.id}', 1, ${data.qte})">+</button>
                    <button class="btn-icon" onclick="window.mouvementStock('${docSnap.id}', -1, ${data.qte})">-</button>
                    <button class="btn-icon" onclick="window.supprimerArticle('${docSnap.id}')" style="color:red;"><i class="fas fa-trash"></i></button>
                </td>
            `;
            container.appendChild(tr);
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = `<tr><td colspan="6" style="color:red">Erreur : ${e.message}</td></tr>`;
    }
}

export async function mouvementStock(id, delta, qteActuelle) {
    const newQte = parseInt(qteActuelle) + delta;
    if(newQte < 0) return alert("Stock ne peut pas être négatif.");
    
    try {
        await updateDoc(doc(db, "stock_articles", id), { qte: newQte });
        chargerStock(); 
    } catch (e) {
        alert("Erreur mise à jour : " + e.message);
    }
}

export async function ajouterArticle() {
    // Cette fonction est appelée par votre bouton "Ajouter Article" qui ouvre une modale dans le HTML
    // Ici on peut mettre la logique de sauvegarde directe si vous utilisiez des prompts, 
    // mais votre HTML utilise une modale #form-stock.
    // La logique spécifique est souvent gérée dans le script principal pour lier les inputs de la modale.
    // Pour simplifier, on garde la logique de base ici :
    
    const nom = document.getElementById('st_nom').value;
    const cat = document.getElementById('st_cat').value;
    const qte = parseInt(document.getElementById('st_qte').value) || 0;
    const pa = parseFloat(document.getElementById('st_pa').value) || 0;
    const pv = parseFloat(document.getElementById('st_pv').value) || 0;
    const fourn = document.getElementById('st_fourn').value;

    if(!nom) return alert("Nom obligatoire");

    try {
        await addDoc(collection(db, "stock_articles"), {
            nom, categorie: cat, qte, prix_achat: pa, prix_vente: pv, fournisseur: fourn,
            date_ajout: new Date().toISOString()
        });
        alert("Article ajouté !");
        document.getElementById('form-stock').classList.add('hidden'); // Ferme la modale
        chargerStock();
    } catch (e) {
        alert("Erreur ajout : " + e.message);
    }
}

export async function supprimerArticle(id) {
    if(confirm("Supprimer définitivement ?")) {
        await deleteDoc(doc(db, "stock_articles", id));
        chargerStock();
    }
}
