
/* =========================================================
   NAIJA MART — FRONTEND APPLICATION
   File: app.js
   Works with the existing index.html and styles.css.
   Backend / Firebase will be connected later.
   ========================================================= */

"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

const dialog = $("#dialog");
const toast = $("#toast");

let toastTimer;
let activeRole = "buyer";
let activeUser = null;
let activeCategory = "";
let currentView = "home";

const state = {
  products: [],
  users: [],
  follows: new Set(),
  likes: new Set(),
  saved: new Set(),
  comments: {},
  applications: [],
  premiumUsers: new Set(),
  verifiedSellers: new Set(),
  suspendedUsers: new Set(),
  messages: [],
  notifications: [],
  nextProductId: 1
};

/* -------------------- UTILITIES -------------------- */

function notify(message) {
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function scrollToSection(selector) {
  const element = $(selector);

  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function showDialog(title, description, content = "") {
  if (!dialog) return;

  $("#dialogTitle").textContent = title;
  $("#dialogText").textContent = description;

  const existing = $("#extraDialogContent");
  if (existing) existing.remove();

  if (content) {
    const wrapper = document.createElement("div");
    wrapper.id = "extraDialogContent";
    wrapper.innerHTML = content;
    $("#dialogText").after(wrapper);
  }

  if (!dialog.open) dialog.showModal();
}

function closeDialog() {
  if (dialog?.open) dialog.close();
}

function requireLogin() {
  if (activeUser) return true;

  openDialog();
  notify("Please sign in to continue.");
  return false;
}

/* -------------------- INITIAL PRODUCTS -------------------- */
/* These are examples for the frontend preview, not live offers. */

function loadSampleProducts() {
  const samples = [
    {
      name: "Premium rice",
      category: "Food & groceries",
      location: "Benin City, Edo",
      price: 0,
      description: "Rice listing preview.",
      seller: "Sample Store",
      stock: 0,
      sample: true
    },
    {
      name: "Fresh garri",
      category: "Food & groceries",
      location: "Lagos, Lagos",
      price: 0,
      description: "Garri listing preview.",
      seller: "Sample Store",
      stock: 0,
      sample: true
    },
    {
      name: "Android smartphone",
      category: "Electronics",
      location: "Port Harcourt, Rivers",
      price: 0,
      description: "Smartphone listing preview.",
      seller: "Sample Store",
      stock: 0,
      sample: true
    },
    {
      name: "Building blocks",
      category: "Building materials",
      location: "Abuja, FCT",
      price: 0,
      description: "Building materials listing preview.",
      seller: "Sample Store",
      stock: 0,
      sample: true
    }
  ];

  state.products = samples.map(product => ({
    id: state.nextProductId++,
    ...product,
    approved: true,
    createdAt: new Date().toISOString()
  }));
}

/* -------------------- PRODUCT SEARCH -------------------- */

function filterProducts() {
  const query = ($("#query")?.value || "").trim().toLowerCase();
  const locationInput = ($("#location")?.value || "").trim().toLowerCase();
  const filterLocation = ($("#filter")?.value || "").trim().toLowerCase();
  const location = locationInput || filterLocation;

  let count = 0;

  $$("#grid article").forEach(card => {
    const name = (card.dataset.name || "").toLowerCase();
    const category = (card.dataset.category || "").toLowerCase();
    const cardLocation = (card.dataset.location || "").toLowerCase();

    const matchesQuery =
      !query ||
      name.includes(query) ||
      category.includes(query);

    const matchesLocation =
      !location || cardLocation.includes(location);

    const matchesCategory =
      !activeCategory ||
      category === activeCategory.toLowerCase();

    const visible =
      matchesQuery && matchesLocation && matchesCategory;

    card.hidden = !visible;
    if (visible) count++;
  });

  const empty = $("#empty");
  if (empty) empty.hidden = count !== 0;

  scrollToSection("#products");

  if (!count) {
    notify("No matching sample products. Try another search.");
  }
}

function clearCategoryFilter() {
  activeCategory = "";
}

/* -------------------- REGISTRATION & LOGIN UI -------------------- */

function openDialog(role = "") {
  activeRole = role || "buyer";

  const title =
    role === "buyer" ? "Join as a buyer" :
    role === "seller" ? "Apply as a seller" :
    "Welcome to Naija Mart";

  const description =
    role === "buyer"
      ? "Create a buyer account to explore products and shops."
      : role === "seller"
        ? "Apply for a seller account. An admin must approve your application before you can publish products."
        : "Choose an account type to get started.";

  if (!dialog) {
    notify("Account screens are unavailable in this page.");
    return;
  }

  const existing = $("#extraDialogContent");
  if (existing) existing.remove();

  $("#dialogTitle").textContent = title;
  $("#dialogText").textContent = description;

  const buttons = $$("[data-role]", dialog);
  buttons.forEach(button => {
    button.hidden = Boolean(role);
  });

  if (role) {
    const wrapper = document.createElement("div");
    wrapper.id = "extraDialogContent";

    wrapper.innerHTML = `
      <form id="accountForm">
        <label class="account-field">
          Full name
          <input name="name" required maxlength="80"
            autocomplete="name" placeholder="Enter your full name">
        </label>

        ${role === "seller" ? `
          <label class="account-field">
            Shop name
            <input name="shop" required maxlength="100"
              placeholder="Enter your shop name">
          </label>

          <label class="account-field">
            Phone number
            <input name="phone" required type="tel"
              autocomplete="tel" placeholder="e.g. 08012345678">
          </label>

          <label class="account-field">
            Business location
            <input name="location" required
              placeholder="State, city, market or area">
          </label>
        ` : ""}

        <label class="account-field">
          Email address
          <input name="email" required type="email"
            autocomplete="email" placeholder="you@example.com">
        </label>

        <label class="account-field">
          Password
          <input name="password" required type="password"
            minlength="8" autocomplete="new-password"
            placeholder="At least 8 characters">
        </label>

        <button class="primary" type="submit" style="width:100%;margin-top:14px">
          ${role === "seller" ? "Submit seller application" : "Create buyer account"}
        </button>

        <p style="font-size:11px;color:#68756e;margin-top:12px">
          Frontend preview only. This form does not create a secure account
          until authentication is connected.
        </p>
      </form>

      <button type="button" id="showLogin"
        class="link-button" style="margin-top:8px">
        Already have an account? Sign in
      </button>

      <button type="button" id="showForgot"
        class="link-button" style="display:block;margin-top:10px">
        Forgot your password?
      </button>
    `;

    $("#dialogText").after(wrapper);

    $("#accountForm").addEventListener("submit", event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);
      const name = String(form.get("name") || "").trim();
      const email = String(form.get("email") || "").trim().toLowerCase();

      if (state.users.some(user => user.email === email)) {
        notify("This email is already in the local preview.");
        return;
      }

      const user = {
        id: `local-${Date.now()}`,
        name,
        email,
        role,
        shop: String(form.get("shop") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        location: String(form.get("location") || "").trim(),
        approved: role === "buyer" ? true : false,
        verified: false,
        premium: false
      };

      state.users.push(user);

      if (role === "seller") {
        state.applications.push(user);
        closeDialog();
        notify("Preview application received. Admin approval is not connected yet.");
      } else {
        closeDialog();
        notify("Preview account created. Secure sign-in requires Firebase.");
      }
    });

    $("#showLogin").addEventListener("click", () => {
      openLogin(role);
    });

    $("#showForgot").addEventListener("click", openForgotPassword);
  }

  if (!dialog.open) dialog.showModal();
}

function openLogin(role = "buyer") {
  if (!dialog) return;

  const existing = $("#extraDialogContent");
  if (existing) existing.remove();

  $$("[data-role]", dialog).forEach(button => {
    button.hidden = true;
  });

  $("#dialogTitle").textContent = "Sign in";
  $("#dialogText").textContent =
    "Enter your email and password. Real authentication will be connected later.";

  const wrapper = document.createElement("div");
  wrapper.id = "extraDialogContent";

  wrapper.innerHTML = `
    <form id="loginForm">
      <label class="account-field">
        Email address
        <input name="email" type="email" required
          autocomplete="email" placeholder="you@example.com">
      </label>
      <label class="account-field">
        Password
        <input name="password" type="password" required
          autocomplete="current-password" placeholder="Your password">
      </label>
      <button class="primary" style="width:100%;margin-top:14px">
        Sign in
      </button>
    </form>
    <button type="button" id="loginForgot"
      class="link-button" style="margin-top:12px">
      Forgot password?
    </button>
  `;

  $("#dialogText").after(wrapper);

  $("#loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const email = String(
      new FormData(event.currentTarget).get("email") || ""
    ).trim().toLowerCase();

    const user = state.users.find(item => item.email === email);

    if (!user) {
      notify("No matching local preview account. Secure sign-in needs Firebase.");
      return;
    }

    if (user.role === "seller" && !user.approved) {
      notify("Your seller application is awaiting approval.");
      return;
    }

    activeUser = user;
    closeDialog();
    renderAccountMenu();
    notify(`Welcome, ${user.name}! This is a local preview session.`);
  });

  $("#loginForgot").addEventListener("click", openForgotPassword);

  if (!dialog.open) dialog.showModal();
}

function openForgotPassword() {
  if (!dialog) return;

  const existing = $("#extraDialogContent");
  if (existing) existing.remove();

  $("#dialogTitle").textContent = "Reset your password";
  $("#dialogText").textContent =
    "Enter your email address. Actual password recovery will work after Firebase is connected.";

  const wrapper = document.createElement("div");
  wrapper.id = "extraDialogContent";
  wrapper.innerHTML = `
    <form id="forgotForm">
      <label class="account-field">
        Email address
        <input name="email" type="email" required
          placeholder="you@example.com">
      </label>
      <button class="primary" style="width:100%;margin-top:14px">
        Continue
      </button>
    </form>
  `;

  $("#dialogText").after(wrapper);

  $("#forgotForm").addEventListener("submit", event => {
    event.preventDefault();
    notify("Password recovery will activate when authentication is connected.");
    closeDialog();
  });
}

/* -------------------- NAVIGATION -------------------- */

function renderAccountMenu() {
  const nav = $("#nav");
  if (!nav || !activeUser) return;

  let button = $("#accountButton");

  if (!button) {
    button = document.createElement("button");
    button.id = "accountButton";
    button.className = "outline";
    nav.appendChild(button);
  }

  button.textContent = activeUser.name;
  button.onclick = () => {
    if (activeUser.role === "seller") {
      openSellerDashboard();
    } else {
      openBuyerDashboard();
    }
  };
}

function signOut() {
  activeUser = null;
  $("#accountButton")?.remove();
  notify("You have signed out of the local preview.");
  showHome();
}

function showHome() {
  currentView = "home";
  $("#products")?.removeAttribute("hidden");
  $("#categories")?.removeAttribute("hidden");
  $("#how")?.removeAttribute("hidden");
  scrollToSection("main");
}

/* -------------------- BUYER DASHBOARD -------------------- */

function openBuyerDashboard() {
  if (!requireLogin()) return;

  currentView = "buyer";

  showDialog(
    "Buyer dashboard",
    `Welcome, ${activeUser.name}. These are preview tools.`,
    `
      <div class="dashboard-actions">
        <button class="account" data-action="buyer-products">Browse products</button>
        <button class="account" data-action="buyer-saved">Saved products (${state.saved.size})</button>
        <button class="account" data-action="buyer-follows">Followed shops (${state.follows.size})</button>
        <button class="account" data-action="buyer-messages">Messages (${state.messages.length})</button>
        <button class="account" data-action="buyer-premium">Buyer Premium</button>
        <button class="account" data-action="signout">Sign out</button>
      </div>
    `
  );

  $$("[data-action]", $("#extraDialogContent")).forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      closeDialog();

      if (action === "buyer-products") {
        showHome();
        scrollToSection("#products");
      }

      if (action === "buyer-saved") showSavedProducts();
      if (action === "buyer-follows") showFollowedShops();
      if (action === "buyer-messages") showMessages();
      if (action === "buyer-premium") showPremiumInfo();
      if (action === "signout") signOut();
    });
  });
}

function showSavedProducts() {
  const products = state.products.filter(product => state.saved.has(product.id));

  showDialog(
    "Saved products",
    products.length
      ? "Your saved products in this preview."
      : "You have not saved any products yet.",
    products.map(product => `
      <div class="account">
        <span><b>${escapeHTML(product.name)}</b>
        <small>${escapeHTML(product.location)}</small></span>
      </div>
    `).join("")
  );
}

function showFollowedShops() {
  const shops = state.users.filter(user => state.follows.has(user.id));

  showDialog(
    "Followed shops",
    shops.length ? "Shops you follow in this preview." : "You are not following any shops yet.",
    shops.map(shop => `
      <div class="account">
        <span><b>${escapeHTML(shop.shop || shop.name)}</b>
        <small>${escapeHTML(shop.location)}</small></span>
      </div>
    `).join("")
  );
}

/* -------------------- SELLER DASHBOARD -------------------- */

function openSellerDashboard() {
  if (!requireLogin()) return;

  if (activeUser.role !== "seller") {
    notify("A seller account is required.");
    return;
  }

  if (!activeUser.approved) {
    showDialog(
      "Seller application pending",
      "Your seller account must be approved by the Naija Mart admin before you can publish products."
    );
    return;
  }

  showDialog(
    "Seller dashboard",
    `Welcome to ${activeUser.shop || activeUser.name}'s shop.`,
    `
      <div class="dashboard-actions">
        <button class="account" data-action="add-product">＋ Add a product</button>
        <button class="account" data-action="my-products">My products</button>
        <button class="account" data-action="seller-profile">Shop profile</button>
        <button class="account" data-action="seller-premium">Seller Premium</button>
        <button class="account" data-action="signout">Sign out</button>
      </div>
    `
  );

  $$("[data-action]", $("#extraDialogContent")).forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      closeDialog();

      if (action === "add-product") openAddProduct();
      if (action === "my-products") showMyProducts();
      if (action === "seller-profile") editShopProfile();
      if (action === "seller-premium") showPremiumInfo();
      if (action === "signout") signOut();
    });
  });
}

function openAddProduct() {
  if (!requireLogin()) return;

  showDialog(
    "Add a product",
    "Create a local product preview. Products are not published to other devices.",
    `
      <form id="productForm">
        <label class="account-field">
          Product name
          <input name="name" required maxlength="100">
        </label>

        <label class="account-field">
          Category
          <select name="category" required>
            <option value="">Choose a category</option>
            <option>Food & groceries</option>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Home & living</option>
            <option>Building materials</option>
            <option>Beauty & care</option>
            <option>Other</option>
          </select>
        </label>

        <label class="account-field">
          Price (₦)
          <input name="price" type="number" required min="0" step="0.01">
        </label>

        <label class="account-field">
          Available quantity
          <input name="stock" type="number" required min="0" step="1">
        </label>

        <label class="account-field">
          Product location
          <input name="location" required
            placeholder="City, state or market">
        </label>

        <label class="account-field">
          Description
          <textarea name="description" maxlength="1500"
            placeholder="Describe your product"></textarea>
        </label>

        <label class="account-field">
          Product photo
          <input name="photo" type="file" accept="image/*">
        </label>

        <p style="font-size:11px;color:#68756e">
          Photos are only previews in this browser. Secure photo storage
          and publishing will require a backend.
        </p>

        <button class="primary" style="width:100%;margin-top:14px">
          Save product preview
        </button>
      </form>
    `
  );

  $("#productForm").addEventListener("submit", event => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const photo = form.elements.photo.files[0];

    const product = {
      id: state.nextProductId++,
      name: String(data.get("name")).trim(),
      category: String(data.get("category")),
      price: Number(data.get("price")),
      stock: Number(data.get("stock")),
      location: String(data.get("location")).trim(),
      description: String(data.get("description") || "").trim(),
      seller: activeUser.shop || activeUser.name,
      sellerId: activeUser.id,
      photoName: photo?.name || "",
      sample: false,
      approved: true,
      createdAt: new Date().toISOString()
    };

    state.products.push(product);
  
