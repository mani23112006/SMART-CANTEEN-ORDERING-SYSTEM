// ===============================
// SMART CANTEEN – CART SCRIPT
// ===============================

// Get cart from localStorage or create empty cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ===============================
// ADD TO CART LOGIC
// ===============================
const orderButtons = document.querySelectorAll(".order-btn");

orderButtons.forEach(button => {
  button.addEventListener("click", () => {
    const name = button.dataset.name;
    const price = Number(button.dataset.price);

    // try to find an image for the item
    const menuItem = button.closest('.menu-item');
    const imgEl = menuItem ? menuItem.querySelector('img') : null;
    const image = imgEl ? imgEl.getAttribute('src') : '';

    addToCart(name, price, image);
  });
});

function addToCart(name, price, image) {
  if (!name || !price) {
    alert("Item data missing!");
    return;
  }

  const existingItem = cart.find(item => item.name === name && item.image === image);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      name: name,
      price: price,
      quantity: 1,
      image: image
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  // non-blocking toast style alert
  const prev = document.getElementById('cart-toast');
  if (prev) prev.remove();
  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.textContent = `${name} added to cart 🛒`;
  toast.style.position = 'fixed';
  toast.style.right = '20px';
  toast.style.bottom = '20px';
  toast.style.background = '#4CAF50';
  toast.style.color = 'white';
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

// ===============================
// CART COUNT (NAVBAR)
// ===============================
function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (!cartCount) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// Load cart count on page load
updateCartCount();

// ===============================
// OPTIONAL: CLEAR CART FUNCTION
// ===============================
function clearCart() {
  localStorage.removeItem("cart");
  cart = [];
  updateCartCount();
}
