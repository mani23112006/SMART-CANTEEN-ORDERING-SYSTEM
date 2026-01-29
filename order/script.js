let cart = [];
let total = 0;
let voucherUsed = false;

function addToCart(item, price) {
    cart.push({ item, price });
    total += price;
    updateCart();
}

function updateCart() {
    const list = document.getElementById("cartList");
    list.innerHTML = "";

    cart.forEach(c => {
        let li = document.createElement("li");
        li.textContent = `${c.item} - ₹${c.price}`;
        list.appendChild(li);
    });

    document.getElementById("total").textContent = "₹" + total;
}

function applyVoucher() {
    if (voucherUsed) {
        alert("Voucher already applied!");
        return;
    }

    if (total === 0) {
        alert("Add items first!");
        return;
    }

    total -= 20;
    voucherUsed = true;
    updateCart();
    alert("₹20 Voucher applied!");
}

function placeOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    document.getElementById("payment-popup").style.display = "block";
}

function confirmPayment() {
    document.getElementById("payment-popup").style.display = "none";
    document.getElementById("approval-popup").style.display = "block";
}

function closeApproval() {
    cart = [];
    total = 0;
    voucherUsed = false;
    updateCart();

    document.getElementById("approval-popup").style.display = "none";
    alert("Order Confirmed!");
}
