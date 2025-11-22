/* ====================================================
   MENU DATA (IDs are numeric strings)
==================================================== */
const MENU = [
  { id: "1", name: "Madras Filter Coffee", category: "filter-coffee", price: 120, img: "https://images.unsplash.com/photo-1706037463363-d8494ee690f6?auto=format&fit=crop&q=60&w=1000" },
  { id: "2", name: "Elaichi Cappuccino", category: "masala", price: 170, img: "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80" },
  { id: "3", name: "Turmeric Latte (Haldi Doodh)", category: "masala", price: 150, img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80" },
  { id: "4", name: "Kapi Cold Brew (South Indian)", category: "cold", price: 190, img: "https://images.unsplash.com/photo-1667064371242-19c2e7b9cb63?auto=format&fit=crop&q=60&w=1000" },
  { id: "5", name: "Cardamom Mocha", category: "masala", price: 180, img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80" },
  { id: "6", name: "Masala Chai Latte", category: "masala", price: 110, img: "https://images.unsplash.com/photo-1648192312898-838f9b322f47?auto=format&fit=crop&q=60&w=1000" },
  { id: "7", name: "Paneer Tandoori Burger", category: "fusion", price: 220, img: "https://images.unsplash.com/photo-1613160775054-d4a634592b7f?auto=format&fit=crop&q=60&w=1000" },
  { id: "8", name: "Spiced Aloo Tikki", category: "fusion", price: 130, img: "https://media.istockphoto.com/id/1204867131/photo/aloo-tikki%C2%A0is-a-popular-north-indian-snack-of-spiced-crisp-potato-patties-with-yogurt-close.webp?a=1&b=1&s=612x612&w=0&k=20&c=W7srpDiofgJxhVeqj8QfsKng66bl-s_TxnbO07_3LWM=" },
  { id: "9", name: "Masala Cold Brew (Chai Twist)", category: "cold", price: 200, img: "https://images.unsplash.com/photo-1586003837615-044e696ab8e8?auto=format&fit=crop&q=60&w=1000" }
];

/* ====================================================
   STATE + DOM
==================================================== */
let cart = {};
const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
  ? "http://localhost:5001/api/bookings"
  : "/api/bookings"; // fallback for production if proxied

const menuGrid = document.getElementById("menuGrid");
const cartBtn = document.getElementById("cartBtn");
const cartPanel = document.getElementById("cartPanel");
const closeCart = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const totalAmountEl = document.getElementById("totalAmount");
const cartCountEl = document.querySelector(".cart-count");
const clearCartBtn = document.getElementById("clearCart");
const checkoutBtn = document.getElementById("checkoutBtn");
const overlay = document.getElementById("overlay");

const filters = document.querySelectorAll('.filter-buttons button');

/* ====================================================
   RENDER MENU
==================================================== */
function renderMenu(list = MENU) {
  menuGrid.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}" loading="lazy" />
      <h3>${item.name}</h3>
      <p class="price">₹${item.price}</p>
      <div class="qty-box" data-id="${item.id}">
        <button class="qty-btn minus" aria-label="decrease">−</button>
        <span class="qty">${cart[item.id] ? cart[item.id].qty : 0}</span>
        <button class="qty-btn plus" aria-label="increase">+</button>
      </div>
    `;
    menuGrid.appendChild(card);

    card.querySelector('.plus').addEventListener('click', () => {
      changeQty(item.id, 1);
      card.querySelector('.qty').textContent = cart[item.id] ? cart[item.id].qty : 0;
    });

    card.querySelector('.minus').addEventListener('click', () => {
      changeQty(item.id, -1);
      card.querySelector('.qty').textContent = cart[item.id] ? cart[item.id].qty : 0;
    });
  });
}

/* ====================================================
   CART LOGIC
==================================================== */
function changeQty(id, delta) {
  const menuItem = MENU.find(m => m.id === id);
  if (!menuItem) return;

  if (!cart[id]) {
    if (delta <= 0) return;
    cart[id] = { item: menuItem, qty: 0 };
  }

  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];

  updateCartUI();
}

function updateCartUI() {
  const totalItems = Object.values(cart).reduce((s, c) => s + c.qty, 0);
  cartCountEl.textContent = totalItems;

  cartItemsEl.innerHTML = "";
  let total = 0;

  for (const id in cart) {
    const c = cart[id];
    total += c.item.price * c.qty;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${c.item.img}" alt="${c.item.name}" />
      <div class="info">
        <strong>${c.item.name}</strong>
        <small>₹${c.item.price} × ${c.qty} = ₹${c.item.price * c.qty}</small>
      </div>
      <div class="controls">
        <button class="qty-btn small minus" data-id="${id}">−</button>
        <span class="qty">${c.qty}</span>
        <button class="qty-btn small plus" data-id="${id}">+</button>
      </div>
    `;
    cartItemsEl.appendChild(div);

    div.querySelector('.minus').addEventListener('click', () => changeQty(id, -1));
    div.querySelector('.plus').addEventListener('click', () => changeQty(id, 1));
  }

  totalAmountEl.textContent = `₹${total}`;
}

/* cart panel open/close */
function openCart() {
  cartPanel.classList.add('open');
  overlay.hidden = false;
  setTimeout(()=>overlay.classList.add('show'),10);
  cartBtn.setAttribute('aria-expanded','true');
  cartPanel.setAttribute('aria-hidden','false');
}
function closeCartPanel() {
  cartPanel.classList.remove('open');
  overlay.classList.remove('show');
  setTimeout(()=>overlay.hidden = true, 220);
  cartBtn.setAttribute('aria-expanded','false');
  cartPanel.setAttribute('aria-hidden','true');
}

cartBtn.addEventListener('click', () => {
  const isOpen = cartPanel.classList.contains('open');
  if (!isOpen) openCart(); else closeCartPanel();
});
closeCart.addEventListener('click', closeCartPanel);
overlay.addEventListener('click', closeCartPanel);

/* clear cart */
clearCartBtn.addEventListener('click', () => {
  cart = {};
  updateCartUI();
});

/* ====================================================
   CHECKOUT (save to API)
   — avoids caching; posts snake_case (server accepts both)
==================================================== */
checkoutBtn.addEventListener('click', async () => {
  if (Object.keys(cart).length === 0) return alert('🛒 Cart is empty!');

  const customerName = prompt("Enter customer name:");
  if (!customerName || !customerName.trim()) return alert("Name is required!");

  try {
    for (const id in cart) {
      const entry = cart[id];
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: 'no-store',
        body: JSON.stringify({
          customer_name: customerName.trim(),
          drink_name: entry.item.name,
          price: entry.item.price * entry.qty
        })
      });
    }

    // refresh bookings after a short delay
    await loadBooking();
    alert('Order saved!');
    cart = {};
    updateCartUI();
    closeCartPanel();

  } catch (err) {
    console.error("Checkout error:", err);
    alert("Failed to save booking");
  }
});

/* ====================================================
   FILTERS (menu)
==================================================== */
filters.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-buttons button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const f = btn.dataset.filter;
    renderMenu(f === "all" ? MENU : MENU.filter(i => i.category === f));
  });
});

/* ====================================================
   BOOKING FORM (manual add)
==================================================== */
function populateBookingSelect() {
  const sel = document.getElementById('coffeeType');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Coffee</option>';
  MENU.forEach(m => {
    const o = document.createElement('option');
    o.value = m.name;
    o.textContent = `${m.name} — ₹${m.price}`;
    sel.appendChild(o);
  });
}

function getPriceByName(drinkName) {
  const item = MENU.find(m => m.name === drinkName);
  return item ? item.price : 0;
}

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("customerName").value.trim();
  const coffeeType = document.getElementById("coffeeType").value;
  if (!name || !coffeeType) return alert("Fill all fields!");
  const price = getPriceByName(coffeeType);

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: 'no-store',
      body: JSON.stringify({
        customer_name: name,
        drink_name: coffeeType,
        price
      })
    });
    document.getElementById("bookingForm").reset();
    await loadBooking();
    alert("Booking Added!");
  } catch (err) {
    console.error("Booking error:", err);
    alert("Failed to add booking");
  }
});

/* ====================================================
   LOAD BOOKINGS → renders table rows
   supports search + date filter client-side
==================================================== */
let latestBookings = []; // cached latest server response

async function loadBooking() {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Network response not ok');
    const bookings = await res.json();
    latestBookings = bookings;
    renderBookingTable(bookings);
  } catch (err) {
    console.error("Load booking error:", err);
  }
}

function renderBookingTable(bookings) {
  const bookingList = document.getElementById("bookingList");
  bookingList.innerHTML = "";
  if (!bookings.length) {
    // show an empty row
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="4" style="opacity:.6;padding:14px">No bookings yet.</td>`;
    bookingList.appendChild(tr);
    return;
  }

  bookings.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(b.customer_name || '')}</td>
      <td>${escapeHtml(b.drink_name || '')}</td>
      <td>₹${b.price}</td>
      <td>${new Date(b.time).toLocaleString()}</td>
    `;
    bookingList.appendChild(tr);
  });
}

/* escape helper */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

/* apply filters for booking table */
document.getElementById('filterBtn').addEventListener('click', () => {
  const q = document.getElementById('searchBooking').value.trim().toLowerCase();
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  let filtered = latestBookings.slice();

  if (q) {
    filtered = filtered.filter(b => (b.customer_name || '').toLowerCase().includes(q) || (b.drink_name || '').toLowerCase().includes(q));
  }
  if (from) {
    const f = new Date(from).setHours(0,0,0,0);
    filtered = filtered.filter(b => new Date(b.time).getTime() >= f);
  }
  if (to) {
    const t = new Date(to).setHours(23,59,59,999);
    filtered = filtered.filter(b => new Date(b.time).getTime() <= t);
  }
  renderBookingTable(filtered);
});

document.getElementById('clearFilterBtn').addEventListener('click', () => {
  document.getElementById('searchBooking').value = '';
  document.getElementById('fromDate').value = '';
  document.getElementById('toDate').value = '';
  renderBookingTable(latestBookings);
});

/* keep polling every 5s for new bookings (optional) */
setInterval(loadBooking, 5000);

/* dark mode simple toggle */
document.getElementById('darkModeToggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
});

/* ====================================================
   INIT
==================================================== */
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  updateCartUI();
  populateBookingSelect();
  loadBooking();
});
