const menuItems = [
  { id: 'coffee', name: 'Coffee', description: 'Freshly brewed coffee', price: 3.5 },
  { id: 'sandwich', name: 'Sandwich', description: 'Turkey and cheddar toast', price: 7.25 },
  { id: 'pizza', name: 'Pizza Slice', description: 'Classic cheese slice', price: 4.75 },
  { id: 'fries', name: 'Fries', description: 'Golden crispy fries', price: 2.9 },
  { id: 'dessert', name: 'Cake', description: 'Sweet slice of cake', price: 4.2 }
];

const state = {
  cart: [],
  activeScreen: 'order',
  paymentMethod: 'cash'
};

const menuGrid = document.getElementById('menu-grid');
const productTableBody = document.querySelector('#product-table tbody');
const cartList = document.getElementById('cart-list');
const checkoutList = document.getElementById('checkout-list');
const subtotalValue = document.getElementById('subtotal-value');
const taxValue = document.getElementById('tax-value');
const totalValue = document.getElementById('total-value');
const checkoutSubtotal = document.getElementById('checkout-subtotal');
const checkoutTax = document.getElementById('checkout-tax');
const checkoutTotal = document.getElementById('checkout-total');
const cartCount = document.getElementById('cart-count');
const productCount = document.getElementById('product-count');
const orderItemCount = document.getElementById('order-item-count');
const checkoutKhr = document.getElementById('checkout-total-khr');
const paymentCurrency = document.getElementById('payment-currency');
const paymentAmount = document.getElementById('payment-amount');
const cashReceivedText = document.getElementById('cash-received-text');
const needAmountText = document.getElementById('need-amount-text');
const clearOrderBtn = document.getElementById('clear-order');
const checkoutOrderBtn = document.getElementById('checkout-order');
const payProductList = document.getElementById('pay-product-list');
const orderMessage = document.getElementById('order-message');
const paymentNote = document.getElementById('payment-note');

const KHR_RATE = 4100;

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function formatKhr(value) {
  return `${Math.round(value).toLocaleString()} KHR`;
}

function renderMenu() {
  // If the menu grid exists (kept for compatibility), render it.
  if (menuGrid) {
    menuGrid.innerHTML = '';
    menuItems.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'menu-card';
      card.innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <button class="primary-btn" data-add-item="${item.id}">Add</button>
        </div>
      `;
      menuGrid.appendChild(card);
    });
  }
}

function generateProductId(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const exists = menuItems.some((m) => m.id === base);
  return exists ? `${base}-${Date.now().toString().slice(-4)}` : base;
}

function renderProductTable() {
  if (!productTableBody) return;
  productTableBody.innerHTML = '';

  menuItems.forEach((item, idx) => {
    const tr = document.createElement('tr');
    const idCell = `#${String(idx + 1).padStart(3, '0')}`;

    tr.innerHTML = `
      <td>${idCell}</td>
      <td><div style="display:flex;align-items:center"><img src="${item.image || ''}" class="small-img" onerror="this.style.display='none'"/> <div><strong>${item.name}</strong><div style="color:var(--muted);font-size:0.9rem">${item.description || ''}</div></div></div></td>
      <td>${item.cost ? formatCurrency(item.cost) : '-'}</td>
      <td>${formatCurrency(item.price)}</td>
      <td class="action-btns">
        <button class="secondary-btn" data-add-item="${item.id}">Add</button>
        <button class="secondary-btn" data-edit-product="${item.id}">Edit</button>
        <button class="secondary-btn" data-delete-product="${item.id}">✕</button>
      </td>
    `;

    productTableBody.appendChild(tr);
  });
}

function getSubtotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getTax() {
  return getSubtotal() * 0.08;
}

function getTotal() {
  return getSubtotal() + getTax();
}

function renderCart() {
  cartList.innerHTML = '';
  // checkoutList is rendered separately for Screen 2

  if (!state.cart.length) {
    const emptyRow = document.createElement('li');
    emptyRow.className = 'cart-item';
    emptyRow.textContent = 'No items yet';
    cartList.appendChild(emptyRow.cloneNode(true));
  } else {
    state.cart.forEach((item) => {
      const cartItem = document.createElement('li');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div><span>${item.quantity}x ${item.name}</span></div>
          <div style="display:flex;align-items:center;gap:12px;">
            <strong>${formatCurrency(item.price * item.quantity)}</strong>
          </div>
        </div>
      `;
      cartList.appendChild(cartItem);
    });
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  cartCount.textContent = `${itemCount} items`;
  if (productCount) productCount.textContent = `${menuItems.length} Products`;
  if (orderItemCount) orderItemCount.textContent = itemCount;
  subtotalValue.textContent = formatCurrency(subtotal);
  taxValue.textContent = formatCurrency(tax);
  totalValue.textContent = formatCurrency(total);
  checkoutSubtotal.textContent = formatCurrency(subtotal);
  checkoutTax.textContent = formatCurrency(tax);
  if (checkoutKhr) checkoutKhr.textContent = formatKhr(total * KHR_RATE);
  renderCheckoutList();
  renderPayProducts();
  updatePaymentSummary();
}

function renderCheckoutList() {
  if (!checkoutList) return;
  checkoutList.innerHTML = '';
  if (!state.cart.length) {
    const li = document.createElement('li');
    li.className = 'checkout-item';
    li.textContent = 'No items in order';
    checkoutList.appendChild(li);
    return;
  }

  state.cart.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'checkout-item';
    li.innerHTML = `
      <div class="item-left">
        <img src="${item.image || ''}" class="small-img" onerror="this.style.display='none'" />
        <div>
          <div style="font-weight:700">${item.name}</div>
          <div style="color:var(--muted);font-size:0.9rem">${formatCurrency(item.price)} each</div>
        </div>
      </div>
      <div class="item-right">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="qty-controls">
            <button data-cart-decrease="${item.id}">-</button>
            <div style="min-width:28px;text-align:center">${item.quantity}</div>
            <button data-cart-increase="${item.id}">+</button>
          </div>
          <div style="font-weight:700">${formatCurrency(item.price * item.quantity)}</div>
        </div>
        <div style="text-align:right"><span class="remove-link" data-cart-remove="${item.id}">Remove</span></div>
      </div>
    `;
    checkoutList.appendChild(li);
  });
}

function renderPayProducts() {
  if (!payProductList) return;
  payProductList.innerHTML = '';

  menuItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'pay-product-card';
    card.innerHTML = `
      <img src="${item.image || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=640&q=80'}" alt="${item.name}" />
      <div class="card-body">
        <div class="product-label">
          <h4 class="product-name">${item.name}</h4>
          <span class="product-type">${item.description || 'Food'}</span>
        </div>
        <div class="product-price">${formatCurrency(item.price)}</div>
        <div class="product-action">
          <button class="primary-btn" data-add-item="${item.id}">Add</button>
        </div>
      </div>
    `;
    payProductList.appendChild(card);
  });
}

function updatePaymentSummary() {
  if (!paymentAmount || !paymentCurrency) return;
  const subtotal = getSubtotal();
  const total = getTotal();
  const amount = parseFloat(paymentAmount.value) || 0;
  const currency = paymentCurrency.value;

  const paidKhr = currency === 'KHR' ? amount : amount * KHR_RATE;
  const totalKhr = total * KHR_RATE;
  const needKhr = Math.max(0, totalKhr - paidKhr);
  const totalUsd = total;
  const paidUsd = currency === 'USD' ? amount : amount / KHR_RATE;
  const needUsd = Math.max(0, totalUsd - paidUsd);

  cashReceivedText.textContent = `Cash received ${formatCurrency(paidUsd)} = ${formatKhr(paidKhr)}`;
  needAmountText.innerHTML = `<strong>Need ${formatCurrency(needUsd)} = ${formatKhr(needKhr)}</strong>`;
}

function addItem(id) {
  const item = menuItems.find((entry) => entry.id === id);
  if (!item) return;

  const existing = state.cart.find((entry) => entry.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...item, quantity: 1 });
  }

  renderCart();
}

function setActiveScreen(screen) {
  state.activeScreen = screen;
  document.querySelectorAll('.screen-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.target === screen);
  });
  document.querySelectorAll('.screen-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `screen-${screen}`);
  });
}

function setPaymentMethod(method) {
  state.paymentMethod = method;
  document.querySelectorAll('.payment-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.method === method);
  });

  const paymentText = {
    cash: 'Cash payment selected.',
    card: 'Card payment selected.',
    qr: 'QR code payment selected.'
  };

  paymentNote.textContent = paymentText[method] || 'Payment selected.';
}

function placeOrder() {
  if (!state.cart.length) {
    orderMessage.textContent = 'Add at least one item before checking out.';
    return;
  }

  orderMessage.textContent = `Order placed successfully via ${state.paymentMethod.toUpperCase()}!`;
  state.cart = [];
  if (paymentAmount) paymentAmount.value = '0.00';
  updatePaymentSummary();
  renderCart();
}

function clearOrder() {
  state.cart = [];
  if (paymentAmount) paymentAmount.value = '0.00';
  if (paymentCurrency) paymentCurrency.value = 'USD';
  setPaymentMethod('cash');
  updatePaymentSummary();
  renderCart();
}

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-item]');
  if (addButton) {
    addItem(addButton.dataset.addItem);
    return;
  }

  const cartRemove = event.target.closest('[data-cart-remove]');
  if (cartRemove) {
    const id = cartRemove.dataset.cartRemove;
    const idx = state.cart.findIndex((c) => c.id === id);
    if (idx >= 0) {
      state.cart.splice(idx, 1);
      renderCart();
    }
    return;
  }

  const cartDecrease = event.target.closest('[data-cart-decrease]');
  if (cartDecrease) {
    const id = cartDecrease.dataset.cartDecrease;
    const item = state.cart.find((c) => c.id === id);
    if (item) {
      item.quantity = Math.max(1, item.quantity - 1);
      renderCart();
    }
    return;
  }

  const cartIncrease = event.target.closest('[data-cart-increase]');
  if (cartIncrease) {
    const id = cartIncrease.dataset.cartIncrease;
    const item = state.cart.find((c) => c.id === id);
    if (item) {
      item.quantity += 1;
      renderCart();
    }
    return;
  }

  const deleteBtn = event.target.closest('[data-delete-product]');
  if (deleteBtn) {
    const id = deleteBtn.dataset.deleteProduct;
    const idx = menuItems.findIndex((m) => m.id === id);
    if (idx >= 0) {
      menuItems.splice(idx, 1);
      renderProductTable();
      renderMenu();
    }
    return;
  }

  const editBtn = event.target.closest('[data-edit-product]');
  if (editBtn) {
    const id = editBtn.dataset.editProduct;
    const product = menuItems.find((m) => m.id === id);
    if (!product) return;
    openEditModal(product);
    return;
  }

  if (event.target.matches('.screen-btn')) {
    setActiveScreen(event.target.dataset.target);
    return;
  }

  if (event.target.id === 'review-order') {
    setActiveScreen('pay');
    return;
  }

  if (event.target.id === 'back-to-order') {
    setActiveScreen('order');
    return;
  }

  if (event.target.matches('.payment-btn')) {
    setPaymentMethod(event.target.dataset.method);
    return;
  }

  if (event.target.id === 'checkout-order') {
    placeOrder();
    return;
  }

  if (event.target.id === 'clear-order') {
    clearOrder();
    return;
  }
});

// Product form handling
const productForm = document.getElementById('product-form');
if (productForm) {
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value.trim();
    const cost = parseFloat(document.getElementById('product-cost').value) || 0;
    const price = parseFloat(document.getElementById('product-price').value) || 0;
    const image = document.getElementById('product-image').value.trim();

    const id = generateProductId(name || `product-${Date.now()}`);
    const newProduct = { id, name: name || 'Untitled', description: category, cost, price, image };
    menuItems.unshift(newProduct);

    renderProductTable();
    renderMenu();

    productForm.reset();
    document.getElementById('product-cost').value = '0.00';
    document.getElementById('product-price').value = '0.00';
  });

  const cancelBtn = document.getElementById('cancel-product');
  if (cancelBtn) cancelBtn.addEventListener('click', () => productForm.reset());
}

// Amount received / change calculation and Pay Now
const amountReceivedInput = document.getElementById('amount-received');
const changeValue = document.getElementById('change-value');
const payNowBtn = document.getElementById('pay-now');
const cancelPaymentBtn = document.getElementById('cancel-payment');

function updateChangeDisplay() {
  if (!amountReceivedInput || !changeValue) return;
  const paid = parseFloat(amountReceivedInput.value) || 0;
  const total = getTotal();
  const change = Math.max(0, paid - total);
  changeValue.textContent = formatCurrency(change);
}

if (paymentAmount) {
  paymentAmount.addEventListener('input', updatePaymentSummary);
}

if (paymentCurrency) {
  paymentCurrency.addEventListener('change', updatePaymentSummary);
}

if (checkoutOrderBtn) {
  checkoutOrderBtn.addEventListener('click', () => {
    placeOrder();
  });
}

if (clearOrderBtn) {
  clearOrderBtn.addEventListener('click', clearOrder);
}

if (cancelPaymentBtn) {
  cancelPaymentBtn.addEventListener('click', () => setActiveScreen('order'));
}

renderMenu();
renderCart();
renderPayProducts();
setActiveScreen('order');
setPaymentMethod('cash');
renderProductTable();
updatePaymentSummary();

// Edit product modal logic
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-product-form');
const editName = document.getElementById('edit-product-name');
const editCategory = document.getElementById('edit-product-category');
const editCost = document.getElementById('edit-product-cost');
const editPrice = document.getElementById('edit-product-price');
const editImage = document.getElementById('edit-product-image');
const editClose = document.getElementById('edit-modal-close');
const editCancel = document.getElementById('edit-cancel');

let editingProductId = null;

function openEditModal(product) {
  if (!editModal) return;
  editingProductId = product.id;
  editName.value = product.name || '';
  editCategory.value = product.description || '';
  editCost.value = product.cost != null ? String(product.cost) : '0.00';
  editPrice.value = product.price != null ? String(product.price) : '0.00';
  editImage.value = product.image || '';
  editModal.style.display = 'flex';
}

function closeEditModal() {
  if (!editModal) return;
  editingProductId = null;
  editForm.reset();
  editModal.style.display = 'none';
}

if (editClose) editClose.addEventListener('click', closeEditModal);
if (editCancel) editCancel.addEventListener('click', closeEditModal);

if (editForm) {
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!editingProductId) return;
    const idx = menuItems.findIndex((m) => m.id === editingProductId);
    if (idx < 0) return;
    const updated = {
      ...menuItems[idx],
      name: editName.value.trim() || 'Untitled',
      description: editCategory.value.trim(),
      cost: parseFloat(editCost.value) || 0,
      price: parseFloat(editPrice.value) || 0,
      image: editImage.value.trim()
    };
    menuItems[idx] = updated;
    renderProductTable();
    renderMenu();
    closeEditModal();
  });
}
