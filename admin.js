"use strict";

(() => {
  const ACCOUNTS_KEY = "gvu-memoflow-accounts-v1";
  const SESSION_KEY = "gvu-memoflow-session-v1";
  const accountTypes = ["Student", "Staff", "Non-staff", "Admin"];
  const departments = [
    "Academic Affairs", "ICT Services", "Student Affairs", "Library", "Facilities",
    "Human Resources", "COMPUTING"
  ];
  const colleges = ["COLBAHS", "COLMAS", "COLHUM", "COLLAW", "COLLEGE OF HEALTH"];
  const inboxRoles = [
    "Head of Department", "Dean", "Registrar", "Bursar", "Vice Chancellor",
    ...departments.map((department) => `Head of Department|${department}`),
    ...colleges.map((college) => `Dean|${college}`)
  ];

  function updateAdminUnitOptions() {
    const role = $("#admin-signup-panel").elements.adminRole.value;
    const unitField = $("#admin-unit-field");
    const unitSelect = $("#admin-signup-panel").elements.adminUnit;
    const needsDepartment = role === "Head of Department";
    const needsCollege = role === "Dean";
    const units = needsDepartment ? departments : needsCollege ? colleges : [];
    $("#admin-unit-label").textContent = needsDepartment ? "Department" : needsCollege ? "College" : "Department or college";
    unitField.classList.toggle("hidden", units.length === 0);
    unitSelect.required = units.length > 0;
    unitSelect.innerHTML = '<option value="">Select a department or college</option>' +
      units.map((unit) => `<option>${unit}</option>`).join("");
    if (units.length === 0) unitSelect.value = "";
  }
  const $ = (selector) => document.querySelector(selector);

  function showMessage(message, success = false) {
    const element = $("#admin-auth-message");
    element.textContent = message;
    element.classList.toggle("success", success);
  }

  function loadAccounts() {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    if (saved === null) return [];
    const accounts = JSON.parse(saved);
    if (!Array.isArray(accounts) || !accounts.every((account) =>
      account && typeof account.name === "string" && typeof account.email === "string" &&
      accountTypes.includes(account.type) && typeof account.salt === "string" &&
      typeof account.passwordHash === "string" &&
      (account.isAdmin === undefined || typeof account.isAdmin === "boolean") &&
      (account.type !== "Admin" || account.isAdmin === true) &&
      (account.adminRole === undefined || inboxRoles.includes(account.adminRole)))) {
      throw new Error("Saved account data has an invalid format.");
    }
    return accounts;
  }

  function saveAccounts(accounts) {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error("Unable to save MemoFlow accounts to this browser.", error);
      throw new Error("Could not save your account. Check browser storage and try again.");
    }
  }

  function hexBytes(hex) {
    if (typeof hex !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(hex)) {
      throw new Error("Saved password data has an invalid format.");
    }
    return new Uint8Array(hex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
  }

  async function passwordHash(password, salt) {
    if (!window.crypto?.subtle) {
      throw new Error("Secure password storage is unavailable. Open this app using a secure local server and try again.");
    }
    const key = await window.crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const result = await window.crypto.subtle.deriveBits({
      name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256"
    }, key, 256);
    return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function switchView(view) {
    const signingUp = view === "signup";
    $("#admin-signin-panel").classList.toggle("hidden", signingUp);
    $("#admin-signup-panel").classList.toggle("hidden", !signingUp);
    $("#admin-signin-tab").classList.toggle("active", !signingUp);
    $("#admin-signup-tab").classList.toggle("active", signingUp);
    $("#admin-signin-tab").setAttribute("aria-selected", String(!signingUp));
    $("#admin-signup-tab").setAttribute("aria-selected", String(signingUp));
    $("#admin-auth-description").textContent = signingUp
      ? "Create an administrator account for your department, college, or university office."
      : "Sign in to review your role inbox.";
    updateAdminUnitOptions();
    showMessage("");
  }

  async function registerAdmin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const selectedRole = String(data.get("adminRole") || "");
    const adminUnit = String(data.get("adminUnit") || "");
    const adminRole = ["Head of Department", "Dean"].includes(selectedRole)
      ? `${selectedRole}|${adminUnit}`
      : selectedRole;
    const password = String(data.get("password") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");
    if (!name || !email) {
      showMessage("Enter your name and a valid email address.");
      return;
    }
    if (!inboxRoles.includes(adminRole) ||
      (["Head of Department", "Dean"].includes(selectedRole) && !adminUnit)) {
      showMessage("Select a valid administrator role.");
      return;
    }
    if (password !== confirmPassword) {
      showMessage("The passwords do not match.");
      form.elements.confirmPassword.focus();
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    try {
      const accounts = loadAccounts();
      if (accounts.some((account) => account.email === email)) {
        showMessage("An account with this email already exists. Sign in instead.");
        return;
      }
      if (!window.crypto?.getRandomValues) {
        throw new Error("Secure password storage is unavailable. Open this app using a secure local server and try again.");
      }
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const account = {
        name,
        email,
        type: "Admin",
        isAdmin: true,
        adminRole,
        adminUnit,
        matricNumber: "",
        department: "",
        salt: [...salt].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
        passwordHash: await passwordHash(password, salt)
      };
      saveAccounts([...accounts, account]);
      sessionStorage.setItem(SESSION_KEY, email);
      window.location.assign("index.html");
    } catch (error) {
      console.error("Unable to create a MemoFlow administrator account.", error);
      showMessage(error.message || "Could not create your account. Please try again.");
    } finally {
      submitButton.disabled = false;
    }
  }

  async function signInAdmin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    try {
      const account = loadAccounts().find((item) => item.email === email);
      if (!account || await passwordHash(password, hexBytes(account.salt)) !== account.passwordHash) {
        showMessage("Email or password is incorrect.");
        return;
      }
      if (account.type !== "Admin" || account.isAdmin !== true) {
        showMessage("This account is not registered as an administrator.");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, account.email);
      window.location.assign("index.html");
    } catch (error) {
      console.error("Unable to sign in to MemoFlow administration.", error);
      showMessage(error.message || "Could not sign in. Please try again.");
    } finally {
      submitButton.disabled = false;
    }
  }

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-password-toggle]");
    if (!toggle) return;
    const input = toggle.parentElement.querySelector("input");
    const isVisible = input.type === "password";
    input.type = isVisible ? "text" : "password";
    toggle.textContent = isVisible ? "Hide" : "Show";
    toggle.setAttribute("aria-label", `${isVisible ? "Hide" : "Show"} password`);
    toggle.setAttribute("aria-pressed", String(isVisible));
  });

  $("#admin-signup-panel").elements.adminRole.addEventListener("change", updateAdminUnitOptions);
  document.querySelectorAll("[data-admin-auth]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.adminAuth));
  });
  $("#admin-signin-panel").addEventListener("submit", signInAdmin);
  $("#admin-signup-panel").addEventListener("submit", registerAdmin);
})();
