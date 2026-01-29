import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ordersList = document.getElementById('orders-list');

onAuthStateChanged(auth, async user => {
  if (!user) return window.location.href = '../signin.html';
  // Simple admin guard: check admins collection for doc with uid
  try {
    const adminsRef = doc(db, 'admins', user.uid);
    const adminSnap = await (await import('https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js')).getDoc(adminsRef);
    if (!adminSnap.exists()) return ordersList.textContent = 'Not authorized (not admin)';
  } catch(e){ console.error(e); ordersList.textContent = 'Auth check failed'; return; }

  const col = collection(db,'scheduledOrders');
  const q = query(col, orderBy('scheduledAt'));
  onSnapshot(q, snap => {
    ordersList.innerHTML = '';
    snap.docs.forEach(d=>{
      const o = { id:d.id, ...d.data() };
      const row = document.createElement('div'); row.className='order-row';
      const when = o.scheduledAt && o.scheduledAt.toDate ? o.scheduledAt.toDate().toLocaleString() : 'N/A';
      row.innerHTML = `<div><strong>${when}</strong> — ${o.userEmail} — ₹${o.total} — <em>${o.status}</em></div>`;
      const list = document.createElement('div'); o.items.forEach(it=>{ const r = document.createElement('div'); r.textContent = `${it.name} x ${it.quantity} = ₹${it.subtotal}`; list.appendChild(r); });
      row.appendChild(list);
      const completeBtn = document.createElement('button'); completeBtn.textContent='Mark Completed'; completeBtn.style.marginRight='8px';
      const cancelBtn = document.createElement('button'); cancelBtn.textContent='Cancel'; cancelBtn.style.background='#e53935'; cancelBtn.style.color='#fff';
      completeBtn.addEventListener('click', ()=> updateStatus(o.id,'completed'));
      cancelBtn.addEventListener('click', ()=> updateStatus(o.id,'cancelled'));
      row.appendChild(completeBtn); row.appendChild(cancelBtn);
      ordersList.appendChild(row);
    });
  }, err=>{ ordersList.textContent = 'Failed to load orders'; console.error(err); });
});

async function updateStatus(id, status){
  try { await updateDoc(doc(db,'scheduledOrders',id), { status }); alert('Updated'); }
  catch(e){ alert('Failed: '+e.message); }
}
