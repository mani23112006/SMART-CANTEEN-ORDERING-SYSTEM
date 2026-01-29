import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, orderBy,
  addDoc, onSnapshot, serverTimestamp, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM elements (new layout)
const menuList = document.getElementById('menu-list');
const filterText = document.getElementById('filter-text');
const categoryFilter = document.getElementById('category-filter');
const dateInput = document.getElementById('schedule-date');
const timeInput = document.getElementById('schedule-time');
const cutoffInput = document.getElementById('cutoff-min');
const summaryItems = document.getElementById('summary-items');
const summaryTotal = document.getElementById('summary-total');
const confirmBtn = document.getElementById('confirm-order');
const clearBtn = document.getElementById('clear-selection');
const ordersContainer = document.getElementById('orders-container');

let menuData = []; // array of menu items
let cart = {}; // { menuId: { ...item, qty } }
let currentUser = null;

// Auth & initial load
onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = 'signin.html';
  currentUser = user;
  init();
});

async function init(){
  await loadMenu();
  renderMenuList();
  subscribeUserOrders(currentUser.uid);
  bindFilters();
}

async function loadMenu(){
  try{
    const col = collection(db,'menu');
    const q = query(col, orderBy('name'));
    const snap = await getDocs(q);
    menuData = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    populateCategories();
  }catch(e){ console.error('loadMenu', e); menuList.textContent = 'Failed to load menu'; }
}

function populateCategories(){
  const cats = Array.from(new Set(menuData.map(m=>m.category||'Uncategorized')));
  categoryFilter.innerHTML = '<option value="">All categories</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
}

function bindFilters(){
  filterText.addEventListener('input', renderMenuList);
  categoryFilter.addEventListener('change', renderMenuList);
}

function renderMenuList(){
  const q = filterText.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  menuList.innerHTML = '';
  const filtered = menuData.filter(m=> (m.available !== false) && ( (!cat || (m.category||'') === cat) ) && ( !q || m.name.toLowerCase().includes(q) ) );
  if (!filtered.length) { menuList.textContent = 'No items found'; return; }

  filtered.forEach(item => {
    const row = document.createElement('div'); row.className = 'menu-row';
    row.innerHTML = `
      <img src="${item.image||'images/default.png'}" alt="${item.name}">
      <div class="menu-meta">
        <div class="menu-name">${item.name}</div>
        <div class="menu-price">₹${item.price}</div>
      </div>
      <div class="menu-actions">
        <div class="qty-control">
          <button class="qty-minus" data-id="${item.id}">-</button>
          <span class="qty-value" id="qty-${item.id}">${cart[item.id]?.qty||0}</span>
          <button class="qty-plus" data-id="${item.id}">+</button>
        </div>
        <button class="add-btn" data-id="${item.id}">Add</button>
      </div>
    `;
    menuList.appendChild(row);
  });

  // attach events
  menuList.querySelectorAll('.qty-plus').forEach(b=>b.addEventListener('click', e=>{
    const id = e.currentTarget.dataset.id; changeQty(id,1);
  }));
  menuList.querySelectorAll('.qty-minus').forEach(b=>b.addEventListener('click', e=>{
    const id = e.currentTarget.dataset.id; changeQty(id,-1);
  }));
  menuList.querySelectorAll('.add-btn').forEach(b=>b.addEventListener('click', e=>{
    const id = e.currentTarget.dataset.id; addToCartFromList(id);
  }));
}

function changeQty(id, delta){
  const item = menuData.find(m=>m.id===id); if(!item) return;
  const cur = cart[id] || { ...item, qty:0 };
  cur.qty = Math.max(0, cur.qty + delta);
  if (cur.qty === 0) delete cart[id]; else cart[id] = cur;
  const span = document.getElementById(`qty-${id}`);
  if (span) span.textContent = cart[id]?.qty||0;
}

function addToCartFromList(id){
  const item = menuData.find(m=>m.id===id); if(!item) return;
  const cur = cart[id] || { ...item, qty:0 };
  cur.qty = Math.max(1, cur.qty + 1);
  cart[id] = cur; updateSummary();
  const span = document.getElementById(`qty-${id}`); if(span) span.textContent = cart[id].qty;
}

function updateSummary(){
  const items = Object.values(cart);
  summaryItems.innerHTML = '';
  if (!items.length){ summaryItems.textContent = 'No items selected'; summaryTotal.textContent = '0'; return; }
  let total = 0;
  items.forEach(it=>{
    const row = document.createElement('div'); row.className='summary-row';
    row.innerHTML = `
      <img src="${it.image||'images/default.png'}">
      <div class="s-meta"><div class="s-name">${it.name}</div><div class="s-price">₹${it.price} x ${it.qty}</div></div>
      <div class="s-sub">₹${it.price * it.qty}</div>
      <div class="s-actions"><button class="s-minus" data-id="${it.id}">-</button><button class="s-plus" data-id="${it.id}">+</button><button class="s-remove" data-id="${it.id}">Remove</button></div>
    `;
    summaryItems.appendChild(row);
    total += it.price * it.qty;
  });
  summaryTotal.textContent = total;

  // bind summary actions
  summaryItems.querySelectorAll('.s-plus').forEach(b=>b.addEventListener('click', e=>{ changeQty(e.currentTarget.dataset.id, 1); updateSummary(); }));
  summaryItems.querySelectorAll('.s-minus').forEach(b=>b.addEventListener('click', e=>{ changeQty(e.currentTarget.dataset.id, -1); updateSummary(); }));
  summaryItems.querySelectorAll('.s-remove').forEach(b=>b.addEventListener('click', e=>{ const id=e.currentTarget.dataset.id; delete cart[id]; updateSummary(); const span=document.getElementById(`qty-${id}`); if(span) span.textContent='0'; }));
}

confirmBtn.addEventListener('click', async ()=>{
  const dateVal = dateInput.value; const timeVal = timeInput.value; 
  // enforce cutoff constraints: allowed window 10..50 minutes
  let cutoff = Number(cutoffInput.value) || 30;
  const MIN_CUTOFF = 10;
  const MAX_CUTOFF_ALLOWED = 50; // business rule: effective max
  if (cutoff < MIN_CUTOFF) cutoff = MIN_CUTOFF;
  if (cutoff > MAX_CUTOFF_ALLOWED) cutoff = MAX_CUTOFF_ALLOWED;
  if (!dateVal || !timeVal) return alert('Choose date and time');
  const scheduledAt = new Date(`${dateVal}T${timeVal}:00`);
  if (scheduledAt <= new Date()) return alert('Scheduled time must be in the future');
  const items = Object.values(cart); if (!items.length) return alert('No items selected');

  const payload = {
    userId: currentUser.uid,
    userEmail: currentUser.email||'',
    items: items.map(i=>({ menuId: i.id, name:i.name, price:i.price, quantity:i.qty, image:i.image||'', subtotal: i.price*i.qty })),
    total: items.reduce((s,i)=> s + i.price*i.qty, 0),
    scheduledAt: scheduledAt,
    createdAt: serverTimestamp(),
    status: 'scheduled',
    cutoffMinutes: cutoff
  };

  confirmBtn.disabled = true; confirmBtn.textContent = 'Scheduling...';
  try{
    await addDoc(collection(db,'scheduledOrders'), payload);
    alert('Scheduled successfully'); cart = {}; updateSummary(); renderMenuList();
  }catch(e){ console.error(e); alert('Failed to schedule: '+e.message); }
  confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm & Schedule';
});

clearBtn.addEventListener('click', ()=>{ if (!confirm('Clear selection?')) return; cart = {}; updateSummary(); renderMenuList(); });

function subscribeUserOrders(uid){
  const col = collection(db,'scheduledOrders');
  const q = query(col, where('userId','==',uid), orderBy('scheduledAt'));
  onSnapshot(q, snap=>{
    const orders = snap.docs.map(d=>({ id:d.id, ...d.data() })); renderUserOrders(orders);
  }, err=>{ console.error(err); ordersContainer.textContent = 'Failed to load orders'; });
}

function renderUserOrders(orders){
  ordersContainer.innerHTML = '';
  if (!orders.length) return ordersContainer.textContent = 'No upcoming orders';
  orders.forEach(o=>{
    const el = document.createElement('div'); el.className='order-card';
    const when = o.scheduledAt && o.scheduledAt.toDate ? o.scheduledAt.toDate().toLocaleString() : 'N/A';
    el.innerHTML = `<div class="o-head"><strong>${when}</strong><span class="o-total">₹${o.total}</span></div>`;
    const list = document.createElement('div'); list.className='o-items'; o.items.forEach(it=>{ const r=document.createElement('div'); r.textContent = `${it.name} x ${it.quantity} = ₹${it.subtotal}`; list.appendChild(r); });
    el.appendChild(list);
    const cutoffMs = (o.cutoffMinutes||60) * 60 * 1000;
    const scheduledTs = o.scheduledAt && o.scheduledAt.toDate ? o.scheduledAt.toDate().getTime() : 0;
    const canCancel = Date.now() < (scheduledTs - cutoffMs) && o.status === 'scheduled';
    const actions = document.createElement('div'); actions.className='o-actions';
    if (canCancel){ const cancel = document.createElement('button'); cancel.className='btn'; cancel.textContent='Cancel'; cancel.addEventListener('click', ()=> cancelOrder(o.id)); actions.appendChild(cancel); }
    el.appendChild(actions);
    ordersContainer.appendChild(el);
  });
}

async function cancelOrder(id){ if (!confirm('Cancel this order?')) return; try{ await updateDoc(doc(db,'scheduledOrders',id), { status:'cancelled' }); alert('Cancelled'); }catch(e){ console.error(e); alert('Failed: '+e.message); } }

