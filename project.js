"use strict";

(() => {
  const STORAGE_KEY = "gvu-memoflow-memos-v1";
  const ACCOUNTS_KEY = "gvu-memoflow-accounts-v1";
  const SESSION_KEY = "gvu-memoflow-session-v1";
  let currentUser = "Dr. Ola";
  let currentUserEmail = "";
  let currentSenderType = "Staff";
  let currentDepartment = "";
  let currentIsAdmin = false;
  let currentAdminRole = "";
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
  const roleLabel = (role) => {
    const [title, unit] = String(role || "").split("|");
    return unit ? `${title} of ${unit}` : title;
  };
  const senderTypeLabel = (type) => ({
    Staff: "Teaching Staff",
    "Non-staff": "Non-teaching Staff"
  })[type] || type;
  function daysAgo(days, hour = 10, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  }
  const initialMemos = [
    {
      id: "GVU-2025-0142",
      title: "Request for approval: Faculty research symposium",
      department: "Academic Affairs",
      author: "Dr. Kemi Adeyemi",
      recipient: "Office of the Campus Administrator",
      priority: "High",
      approver: "Dean",
      status: "Pending Approval",
      body: "I am writing to request approval to host the annual faculty research symposium this November. The event will bring together faculty, postgraduate students, and invited researchers to share current work and strengthen research collaboration across the Lagos Campus.\n\nWe request use of the main auditorium and approval for the associated event arrangements. Academic Affairs will coordinate the programme and provide a final budget for review.",
      createdAt: daysAgo(1, 9, 15),
      updatedAt: daysAgo(1, 9, 15),
      history: [{ action: "Submitted for approval", actor: "Dr. Kemi Adeyemi", at: daysAgo(1, 9, 15) }]
    },
    {
      id: "GVU-2025-0141",
      title: "Campus network maintenance schedule",
      department: "ICT Services",
      author: "Tunde Bakare",
      recipient: "All department heads",
      priority: "Normal",
      approver: "Registrar",
      status: "Pending Approval",
      body: "ICT Services proposes a scheduled network maintenance window on an upcoming Saturday, from 7:00 a.m. to 10:00 a.m. Campus Wi-Fi and selected internal systems may be temporarily unavailable during this period.\n\nKindly approve the attached communication plan so staff can be notified in advance.",
      createdAt: daysAgo(1, 8, 40),
      updatedAt: daysAgo(1, 8, 40),
      history: [{ action: "Submitted for approval", actor: "Tunde Bakare", at: daysAgo(1, 8, 40) }]
    },
    {
      id: "GVU-2025-0140",
      title: "Q4 student orientation programme",
      department: "Student Affairs",
      author: "Mrs. Bola Eze",
      recipient: "Office of the Campus Administrator",
      priority: "Normal",
      approver: "Head of Department",
      status: "Pending Approval",
      body: "Student Affairs seeks approval for the upcoming student orientation programme. The programme will introduce new students to campus resources, academic services, and student support teams.\n\nPlease review the proposed schedule and approve coordination with the relevant departments.",
      createdAt: daysAgo(2, 14, 20),
      updatedAt: daysAgo(2, 14, 20),
      history: [{ action: "Submitted for approval", actor: "Mrs. Bola Eze", at: daysAgo(2, 14, 20) }]
    },
    {
      id: "GVU-2025-0139",
      title: "Library extended-hours pilot proposal",
      department: "Library",
      author: "Mr. Samuel Ojo",
      recipient: "Office of the Campus Administrator",
      priority: "High",
      approver: "Vice Chancellor",
      status: "Approved",
      body: "The Library proposes a four-week extended-hours pilot during the examination period, keeping the reading room open until 10:00 p.m. on weekdays. This will improve access to study space for students preparing for examinations.\n\nApproval is requested to arrange duty cover and communicate the revised hours.",
      createdAt: daysAgo(4, 11, 5),
      updatedAt: daysAgo(2, 10, 25),
      history: [
        { action: "Submitted for approval", actor: "Mr. Samuel Ojo", at: daysAgo(4, 11, 5) },
        { action: "Approved", actor: currentUser, at: daysAgo(2, 10, 25), note: "Approved for a four-week pilot. Please share a brief usage update at the end of the trial." }
      ]
    },
    {
      id: "GVU-2025-0138",
      title: "Request for classroom furniture repairs",
      department: "Facilities",
      author: "Grace Nwosu",
      recipient: "Campus Facilities Office",
      priority: "Normal",
      approver: "Bursar",
      status: "Pending Approval",
      body: "Facilities has identified damaged desks and chairs in lecture rooms B12 and B14. We request approval to schedule repairs before the next teaching week so that the rooms are safe and ready for students.",
      createdAt: daysAgo(5, 9, 30),
      updatedAt: daysAgo(5, 9, 30),
      history: [{ action: "Submitted for approval", actor: "Grace Nwosu", at: daysAgo(5, 9, 30) }]
    },
    {
      id: "GVU-2025-0137",
      title: "Staff development workshop budget",
      department: "Human Resources",
      author: "Chika Mensah",
      recipient: "Office of the Campus Administrator",
      priority: "Normal",
      approver: "Registrar",
      status: "Approved",
      body: "Human Resources requests approval for the proposed staff development workshop budget. The workshop will focus on student-centred service, effective communication, and practical collaboration between departments.",
      createdAt: daysAgo(6, 13, 40),
      updatedAt: daysAgo(4, 12),
      history: [
        { action: "Submitted for approval", actor: "Chika Mensah", at: daysAgo(6, 13, 40) },
        { action: "Approved", actor: currentUser, at: daysAgo(4, 12) }
      ]
    }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const safeDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  };
  const dateLabel = (value, options = { day: "numeric", month: "short" }) =>
    new Intl.DateTimeFormat("en-GB", options).format(safeDate(value));
  const initials = (value) => value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const slug = (value) => value.toLowerCase().replace(/\s+/g, "-");

  function normalizeMemos(records) {
    const legacyRoles = {
      "Campus Administrator": "Head of Department",
      "Head Of Campus": "Head of Department",
      "Director of Finance": "Bursar",
      "Vice-Chancellor": "Vice Chancellor"
    };
    return records.map((memo) => {
      const directMessage = memo.delivery === "direct" || Boolean(memo.recipientEmail);
      const assignedRole = directMessage ? "" : inboxRoles.includes(memo.assignedRole)
        ? memo.assignedRole
        : legacyRoles[memo.approver] || (inboxRoles.includes(memo.approver) ? memo.approver : "Head of Department");
      return { ...memo, assignedRole, approver: assignedRole };
    });
  }

  function loadMemos() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) return normalizeMemos(initialMemos.map((memo) => ({ ...memo, history: [...memo.history] })));
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || !parsed.every((memo) =>
        memo && typeof memo.id === "string" && typeof memo.title === "string" &&
        typeof memo.status === "string" && Array.isArray(memo.history))) {
        throw new Error("Saved memo data has an invalid format.");
      }
      return normalizeMemos(parsed);
    } catch (error) {
      console.error("Unable to load MemoFlow data from this browser.", error);
      return normalizeMemos(initialMemos.map((memo) => ({ ...memo, history: [...memo.history] })));
    }
  }

  let memos = loadMemos();
  let activeView = "inbox";
  let activeRole = "Head of Department";
  let activeMemoId = null;
  let searchTerm = "";
  let editingDraftId = null;

  const viewLabels = { overview: "Overview", all: "All memos", approvals: "My approval queue", inbox: "Inbox", sent: "Sent", drafts: "Drafts", messages: "Approval messages" };
  const viewDescriptions = {
    all: "Browse and track institutional correspondence across campus.",
    approvals: "Review memos submitted to your approval queue.",
    inbox: "Memos sent to your account.",
    sent: "Memos you have sent to other accounts.",
    drafts: "Continue working on saved memos.",
    messages: "Track your memos and read responses from your selected university office."
  };
  const statusLabels = { "Pending Approval": "Pending approval", Approved: "Message approved", Rejected: "Returned", Draft: "Draft", Sent: "Sent" };

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
      return true;
    } catch (error) {
      console.error("Unable to save MemoFlow data to this browser.", error);
      showToast("Could not save changes. Check browser storage and try again.");
      return false;
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    $("#toast-region").append(toast);
    window.setTimeout(() => toast.remove(), 3800);
  }

  function showAuthMessage(message, success = false) {
    const messageElement = $("#auth-message");
    messageElement.textContent = message;
    messageElement.classList.toggle("success", success);
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
    return new Uint8Array(hex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
  }

  async function passwordHash(password, salt) {
    if (!window.crypto?.subtle) {
      throw new Error("Secure password storage is unavailable in this browser. Open the app using a secure local server and try again.");
    }
    const key = await window.crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const result = await window.crypto.subtle.deriveBits({
      name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256"
    }, key, 256);
    return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function setAuthView(view) {
    const signingUp = view === "signup";
    $("#signin-panel").classList.toggle("hidden", signingUp);
    $("#signup-panel").classList.toggle("hidden", !signingUp);
    $("#signin-tab").classList.toggle("active", view === "signin");
    $("#signup-tab").classList.toggle("active", signingUp);
    $("#signin-tab").setAttribute("aria-selected", String(view === "signin"));
    $("#signup-tab").setAttribute("aria-selected", String(signingUp));
    $("#auth-title").textContent = signingUp ? "Create your account" : "Welcome back";
    $("#auth-description").textContent = signingUp
      ? "Register as a student, teaching staff member, or non-teaching staff member."
      : "Sign in to create and track your memos.";
    updateMatricNumberField();
    showAuthMessage("");
  }

  function updateMatricNumberField() {
    const type = $("#signup-panel").elements.type.value;
    const isStudent = type === "Student";
    const isStaff = type === "Staff";
    const field = $("#signup-panel").elements.matricNumber;
    const collegeField = $("#signup-panel").elements.department;
    $("#matric-number-field").classList.toggle("hidden", !isStudent);
    $("#signup-college-field").classList.toggle("hidden", !isStaff);
    field.required = isStudent;
    collegeField.required = isStaff;
    if (!isStudent) field.value = "";
    if (!isStaff) collegeField.value = "";
  }

  function updateMemoRouting() {
    const form = $("#memo-form");
    const approvalRequest = currentIsAdmin || form.elements.deliveryMode.value === "approval";
    const directMessage = !currentIsAdmin && !approvalRequest;
    $("#delivery-mode-field").classList.toggle("hidden", currentIsAdmin);
    $("#recipient-email-field").classList.toggle("hidden", !directMessage);
    $("#approver-field").classList.toggle("hidden", !approvalRequest);
    form.elements.recipientEmail.required = directMessage;
    form.elements.approver.required = approvalRequest;
    form.querySelector("button[type='submit']").innerHTML = approvalRequest
      ? 'Send for approval <span>→</span>'
      : 'Send memo <span>→</span>';
    $("#memo-modal-description").textContent = currentIsAdmin
      ? `Review and route a memo to the ${roleLabel(activeRole)} inbox.`
      : approvalRequest
        ? "Send your request to an administrator. It will remain pending until reviewed."
        : "Write a memo and send it to another account.";
  }

  function activateAccount(account) {
    currentUser = account.name;
    currentUserEmail = account.email;
    currentIsAdmin = account.type === "Admin" && account.isAdmin === true;
    currentAdminRole = currentIsAdmin && inboxRoles.includes(account.adminRole)
      ? account.adminRole
      : currentIsAdmin ? "Head of Department" : "";
    currentSenderType = currentIsAdmin ? "Staff" : account.type;
    currentDepartment = account.department || "";
    activeRole = currentAdminRole || "Head of Department";
    activeView = "inbox";
    const student = currentSenderType === "Student";
    $("#profile-name").textContent = currentUser;
    $("#active-role-label").textContent = currentIsAdmin ? "Administrator" : senderTypeLabel(currentSenderType);
    $("#profile-avatar").textContent = initials(currentUser);
    $("#top-avatar").textContent = initials(currentUser);
    $("#top-avatar").setAttribute("aria-label", currentUser);
    $("#memo-form").elements.author.value = currentUser;
    $("#memo-form").elements.senderType.value = currentSenderType;
    $("#memo-form").elements.author.closest("label").classList.toggle("hidden", student);
    $("#memo-form").elements.senderType.closest("label").classList.toggle("hidden", student);
    const departmentField = $("#memo-form").elements.department;
    departmentField.value = [...departmentField.options].some((option) => option.value === currentDepartment)
      ? currentDepartment
      : "";
    $("#admin-section").classList.toggle("hidden", !currentIsAdmin);
    $("#app-shell").classList.toggle("admin-dashboard", currentIsAdmin);
    $("#admin-label").textContent = currentIsAdmin ? roleLabel(activeRole) : "Admin";
    $("#admin-role-nav").innerHTML = currentIsAdmin
      ? `<button class="nav-link role-inbox-link" data-inbox-role="${escapeHtml(activeRole)}"><span class="nav-icon">✉</span><span>${escapeHtml(roleLabel(activeRole))}</span><span class="nav-count" data-inbox-count="${escapeHtml(activeRole)}">0</span></button>`
      : "";
    $("#global-search").closest(".search-box").classList.remove("hidden");
    $("#notification-button").classList.toggle("hidden", !currentIsAdmin);
    $("#save-draft-button").classList.remove("hidden");
    $("#memo-form").elements.deliveryMode.value = "direct";
    updateMemoRouting();
    $("#auth-screen").classList.add("hidden");
    $("#app-shell").classList.remove("hidden");
    showAuthMessage("");
    render();
  }

  function restoreSession() {
    try {
      const email = sessionStorage.getItem(SESSION_KEY);
      if (!email) return;
      const account = loadAccounts().find((item) => item.email === email);
      if (!account) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      activateAccount(account);
    } catch (error) {
      console.error("Unable to restore the MemoFlow session.", error);
      showAuthMessage("Could not restore your session. Please sign in again.");
    }
  }

  async function registerAccount(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const type = String(data.get("type") || "");
    const matricNumber = String(data.get("matricNumber") || "").trim();
    const department = String(data.get("department") || "").trim();
    const password = String(data.get("password") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");
    if (!name || !email) {
      showAuthMessage("Enter your name and a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      showAuthMessage("The passwords do not match.");
      form.elements.confirmPassword.focus();
      return;
    }
    if (!["Student", "Staff", "Non-staff"].includes(type)) {
      showAuthMessage("Choose Student, Teaching Staff, or Non-teaching Staff as your account type.");
      return;
    }
    if (type === "Student" && !matricNumber) {
      showAuthMessage("Enter your matric number to register as a student.");
      form.elements.matricNumber.focus();
      return;
    }
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    try {
      const accounts = loadAccounts();
      if (accounts.some((account) => account.email === email)) {
        showAuthMessage("An account with this email already exists. Sign in instead.");
        return;
      }
      if (!window.crypto?.getRandomValues) {
        throw new Error("Secure password storage is unavailable in this browser. Open the app using a secure local server and try again.");
      }
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const account = {
        name, email, type, isAdmin: false,
        matricNumber: type === "Student" ? matricNumber : "", department,
        salt: [...salt].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
        passwordHash: await passwordHash(password, salt)
      };
      saveAccounts([...accounts, account]);
      sessionStorage.setItem(SESSION_KEY, email);
      form.reset();
      updateMatricNumberField();
      activateAccount(account);
    } catch (error) {
      console.error("Unable to create a MemoFlow account.", error);
      showAuthMessage(error.message || "Could not create your account. Please try again.");
    } finally {
      submitButton.disabled = false;
    }
  }

  async function signIn(event) {
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
        showAuthMessage("Email or password is incorrect.");
        return;
      }
      const isAdminAccount = account.type === "Admin" && account.isAdmin === true;
      if (isAdminAccount) {
        showAuthMessage("Administrators must sign in from the separate Admin access page.");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, account.email);
      form.reset();
      activateAccount(account);
    } catch (error) {
      console.error("Unable to sign in to MemoFlow.", error);
      showAuthMessage(error.message || "Could not sign in. Please try again.");
    } finally {
      submitButton.disabled = false;
    }
  }

  function signOut() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("Unable to end the MemoFlow session.", error);
      showAuthMessage("Could not sign out. Please try again.");
      return;
    }
    currentUser = "";
    currentUserEmail = "";
    currentSenderType = "";
    currentDepartment = "";
    currentIsAdmin = false;
    currentAdminRole = "";
    $("#app-shell").classList.remove("admin-dashboard");
    $("#app-shell").classList.add("hidden");
    $("#auth-screen").classList.remove("hidden");
    setAuthView("signin");
  }

  function statusMarkup(status) {
    return `<span class="status-badge status-${slug(status)}">${escapeHtml(statusLabels[status] || status)}</span>`;
  }

  function priorityMarkup(priority) {
    return `<span class="priority-badge priority-${slug(priority)}">${escapeHtml(priority)}</span>`;
  }

  function isCurrentUserMemo(memo) {
    if (currentSenderType === "Student") return Boolean(currentUserEmail) && memo.authorEmail === currentUserEmail;
    return memo.authorEmail ? memo.authorEmail === currentUserEmail : memo.author === currentUser;
  }

  function dashboardMemos() {
    if (!currentIsAdmin) return memos;
    return memos.filter((memo) =>
      memo.assignedRole === activeRole ||
      isCurrentUserMemo(memo) ||
      (memo.delivery === "direct" && memo.recipientEmail === currentUserEmail));
  }

  function canAccessMemo(memo) {
    if (!memo) return false;
    if (!currentIsAdmin) {
      return isCurrentUserMemo(memo) || memo.recipientEmail === currentUserEmail;
    }
    if (activeView === "inbox") {
      return (memo.status === "Pending Approval" && memo.assignedRole === activeRole) ||
        (memo.delivery === "direct" && memo.recipientEmail === currentUserEmail);
    }
    if (activeView === "drafts") return memo.status === "Draft" && isCurrentUserMemo(memo);
    if (activeView === "sent") return memo.status !== "Draft" && isCurrentUserMemo(memo);
    if (activeView === "overview") {
      return memo.assignedRole === activeRole || isCurrentUserMemo(memo) ||
        (memo.delivery === "direct" && memo.recipientEmail === currentUserEmail);
    }
    return false;
  }

  function memoRow(memo) {
    const senderOrOffice = activeView === "sent" || activeView === "drafts"
      ? memo.recipientEmail || roleLabel(memo.recipient)
      : memo.author;
    return `<tr class="table-row" data-memo-id="${escapeHtml(memo.id)}" tabindex="0" aria-label="Open memo: ${escapeHtml(memo.title)}">
      <td><div class="memo-cell"><span class="memo-symbol">▤</span><span class="memo-cell-copy"><span class="memo-title">${escapeHtml(memo.title)}</span><span class="memo-subtitle">${escapeHtml(memo.id)} · ${escapeHtml(memo.department)}</span></span></div></td>
      <td>${escapeHtml(senderOrOffice)}</td><td>${dateLabel(memo.createdAt)}</td><td>${priorityMarkup(memo.priority)}</td><td>${statusMarkup(memo.status)}</td><td class="row-arrow">›</td>
    </tr>`;
  }

  function approvalItem(memo) {
    return `<article class="approval-item" data-memo-id="${escapeHtml(memo.id)}" tabindex="0" aria-label="Review memo: ${escapeHtml(memo.title)}">
      <span class="department-avatar">${escapeHtml(initials(memo.department))}</span>
      <span class="approval-copy"><span class="approval-title">${escapeHtml(memo.title)}</span><span class="approval-sub">${escapeHtml(memo.author)} · ${escapeHtml(memo.department)} · ${dateLabel(memo.createdAt)}</span></span>
      <span class="priority-dot ${slug(memo.priority)}" title="${escapeHtml(memo.priority)} priority"></span>
    </article>`;
  }

  function renderHeading() {
    const label = viewLabels[activeView];
    $("#breadcrumb-current").textContent = label;
    $("#page-title").innerHTML = activeView === "overview"
      ? `Good morning, ${escapeHtml(currentUser)} <span class="wave">✳</span>`
      : escapeHtml(label);
    $("#page-subtitle").textContent = activeView === "overview"
      ? currentIsAdmin ? `Your ${roleLabel(activeRole)} dashboard and messages.` : "Here’s what’s happening across your campus today."
      : activeView === "approvals" || activeView === "inbox"
        ? currentIsAdmin ? `Messages sent to you and the ${roleLabel(activeRole)} inbox.` : "Your received memos will appear here."
        : viewDescriptions[activeView];
    $("#active-role-label").textContent = currentIsAdmin
      ? `Admin · ${roleLabel(activeRole)}`
      : senderTypeLabel(currentSenderType || activeRole);
  }

  function renderStats() {
    const visibleMemos = dashboardMemos();
    $("#stat-total").textContent = visibleMemos.filter((memo) => memo.status !== "Draft").length;
    $("#stat-pending").textContent = visibleMemos.filter((memo) =>
      memo.status === "Pending Approval" && (!currentIsAdmin || memo.assignedRole === activeRole)).length;
    $("#stat-approved").textContent = visibleMemos.filter((memo) => memo.status === "Approved").length;
    $("#stat-drafts").textContent = visibleMemos.filter((memo) =>
      memo.status === "Draft" && (!currentIsAdmin || isCurrentUserMemo(memo))).length;
    const rolePending = currentIsAdmin
      ? memos.filter((memo) => memo.status === "Pending Approval" && memo.assignedRole === activeRole).length
      : 0;
    const received = currentIsAdmin
      ? rolePending + memos.filter((memo) =>
        memo.delivery === "direct" && memo.recipientEmail === currentUserEmail && memo.status !== "Draft").length
      : memos.filter((memo) => memo.recipientEmail === currentUserEmail && memo.status !== "Draft").length;
    $("#nav-pending-count").textContent = received;
    $("#nav-pending-count").classList.toggle("hidden", received === 0);
    $$("[data-inbox-count]").forEach((badge) => {
      const count = currentIsAdmin && badge.dataset.inboxCount === activeRole
        ? memos.filter((memo) => memo.status === "Pending Approval" && memo.assignedRole === badge.dataset.inboxCount).length
        : 0;
      badge.textContent = count;
      badge.classList.toggle("hidden", count === 0);
    });
  }

  function renderChart() {
    const today = new Date();
    const visibleMemos = dashboardMemos();
    const weekdays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - ((today.getDay() + 6) % 7) + index);
      return date;
    });
    const weekCounts = weekdays.map((date) => {
      const countForDay = (memo) => safeDate(memo.createdAt).toDateString() === date.toDateString();
      return {
        created: visibleMemos.filter((memo) => memo.status !== "Draft" && countForDay(memo)).length,
        approved: visibleMemos.filter((memo) => memo.history.some((event) =>
          event.action === "Approved" && safeDate(event.at).toDateString() === date.toDateString())).length
      };
    });
    const max = Math.max(1, ...weekCounts.flatMap((item) => [item.created, item.approved]));
    $("#chart-bars").innerHTML = weekCounts.map((item) =>
      `<span class="bar-group" title="${item.created} created, ${item.approved} approved">
        <i class="bar secondary" style="height:${Math.max(item.approved ? 8 : 4, Math.round(item.approved / max * 100))}%"></i>
        <i class="bar" style="height:${Math.max(item.created ? 8 : 4, Math.round(item.created / max * 100))}%"></i>
      </span>`).join("");
    $("#chart-total").textContent = visibleMemos.filter((memo) => memo.status !== "Draft").length;
    $$(".chart-days span").forEach((day, index) => {
      day.textContent = new Intl.DateTimeFormat("en", { weekday: "short" }).format(weekdays[index]);
      day.title = dateLabel(weekdays[index], { weekday: "long", day: "numeric", month: "long" });
    });
  }

  function renderOverview() {
    const visibleMemos = dashboardMemos();
    const pending = visibleMemos.filter((memo) => memo.status === "Pending Approval" && memo.assignedRole === activeRole)
      .sort((a, b) => safeDate(b.createdAt) - safeDate(a.createdAt));
    $("#dashboard-approval-subtitle").textContent = `Memos in the ${roleLabel(activeRole)} inbox`;
    $("#dashboard-approvals").innerHTML = pending.length
      ? pending.slice(0, 3).map(approvalItem).join("")
      : '<div class="approval-empty"><span>✓</span><strong>All caught up</strong><p>There are no memos waiting for your review.</p></div>';
    $("#recent-memos").innerHTML = visibleMemos.filter((memo) => memo.status !== "Draft")
      .sort((a, b) => safeDate(b.createdAt) - safeDate(a.createdAt))
      .slice(0, 5).map(memoRow).join("");
    const recentLink = $("#recent-memos").closest(".panel").querySelector("[data-view]");
    if (currentIsAdmin) {
      recentLink.dataset.view = "inbox";
      recentLink.innerHTML = 'Open inbox <span>→</span>';
    } else {
      recentLink.dataset.view = "all";
      recentLink.innerHTML = 'All memos <span>→</span>';
    }
    renderChart();
  }

  function filteredMemos() {
    return memos.filter((memo) => {
      if (activeView === "inbox") {
        if (currentIsAdmin) {
          const roleInboxMemo = memo.status === "Pending Approval" && memo.assignedRole === activeRole;
          const directMessage = memo.delivery === "direct" && memo.recipientEmail === currentUserEmail;
          if (!roleInboxMemo && !directMessage) return false;
        } else if (memo.status === "Draft" || memo.recipientEmail !== currentUserEmail) return false;
      }
      if (activeView === "drafts" && (memo.status !== "Draft" || !isCurrentUserMemo(memo))) return false;
      if (activeView === "sent" && (memo.status === "Draft" || !isCurrentUserMemo(memo))) return false;
      if (activeView === "all") return false;
      if (searchTerm) {
        const searchable = [memo.id, memo.title, memo.author, memo.department, memo.recipient, memo.body, memo.status]
          .join(" ").toLocaleLowerCase();
        if (!searchable.includes(searchTerm.toLocaleLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => currentSenderType === "Student"
      ? safeDate(b.updatedAt) - safeDate(a.updatedAt)
      : safeDate(b.createdAt) - safeDate(a.createdAt));
  }

  function renderList() {
    const memosToShow = filteredMemos();
    $("#memo-list").innerHTML = memosToShow.map(memoRow).join("");
    const inbox = activeView === "inbox";
    $("#list-view thead th:nth-child(2)").textContent = inbox ? "FROM" : "TO";
    $("#memo-list").closest(".table-wrap").classList.toggle("hidden", memosToShow.length === 0);
  }

  function render() {
    if (activeView === "messages") activeView = "inbox";
    renderHeading();
    renderStats();
    const isOverview = activeView === "overview";
    $("#overview-view").classList.toggle("hidden", !isOverview);
    $("#list-view").classList.toggle("hidden", isOverview);
    $$(".nav-link").forEach((button) => {
      const isActiveView = button.dataset.view === activeView && !button.dataset.inboxRole;
      const isActiveInbox = button.dataset.inboxRole === activeRole && activeView === "inbox";
      button.classList.toggle("active", isActiveView || isActiveInbox);
    });
    $("#admin-toggle").classList.toggle("active", currentIsAdmin && activeView === "inbox");
    if (isOverview) renderOverview();
    else renderList();
  }

  function setView(view) {
    if (view === "messages" || view === "approvals" ||
      (currentIsAdmin && view === "all") ||
      (!currentIsAdmin && ["overview", "all"].includes(view))) view = "inbox";
    if (!viewLabels[view]) return;
    activeView = view;
    render();
    $("#sidebar").classList.remove("open");
    $("#mobile-scrim").classList.remove("show");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openModal(modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    const focusable = $("input, select, textarea, button", modal);
    if (focusable) window.setTimeout(() => focusable.focus(), 30);
  }

  function closeModals() {
    $$(".modal-backdrop").forEach((modal) => modal.classList.add("hidden"));
    document.body.style.overflow = "";
    activeMemoId = null;
    $("#detail-review").classList.add("hidden");
    $("#review-note").value = "";
  }

  function resetMemoForm() {
    $("#memo-form").reset();
    editingDraftId = null;
    $("#memo-modal-title").textContent = "Compose a memo";
    $("#memo-form").elements.deliveryMode.value = "direct";
    updateMemoRouting();
    $("#save-draft-button").textContent = "Save as draft";
  }

  function openMemoForm(memo = null) {
    resetMemoForm();
    if (memo) {
      editingDraftId = memo.id;
      const form = $("#memo-form");
      for (const field of ["title", "senderType", "author", "department", "priority", "approver", "recipientEmail", "body"]) {
        form.elements[field].value = memo[field] ?? "";
      }
      form.elements.deliveryMode.value = memo.delivery === "office" ? "approval" : "direct";
      updateMemoRouting();
      form.elements.senderType.value = memo.senderType || currentSenderType;
      form.elements.author.value = memo.author || currentUser;
      $("#memo-modal-title").textContent = "Edit draft";
      $("#save-draft-button").textContent = "Save changes";
    } else {
      const form = $("#memo-form");
      form.elements.author.value = currentUser;
      form.elements.senderType.value = currentSenderType;
      const departmentField = form.elements.department;
      departmentField.value = [...departmentField.options].some((option) => option.value === currentDepartment)
        ? currentDepartment
        : "";
    }
    openModal($("#memo-modal"));
  }

  function nextMemoId() {
    const year = new Date().getFullYear();
    const sequence = memos.reduce((largest, memo) => {
      const match = memo.id.match(/-(\d+)$/);
      return match ? Math.max(largest, Number(match[1])) : largest;
    }, 0) + 1;
    return `GVU-${year}-${String(sequence).padStart(4, "0")}`;
  }

  function formMemo(status) {
    const data = new FormData($("#memo-form"));
    const now = new Date().toISOString();
    const existing = editingDraftId ? memos.find((memo) => memo.id === editingDraftId) : null;
    const senderType = currentSenderType === "Student" ? "Student" : String(data.get("senderType") || "").trim();
    const authorName = currentSenderType === "Student"
      ? currentUser
      : String(data.get("author") || "").trim() || currentUser;
    const directMessage = !currentIsAdmin && data.get("deliveryMode") !== "approval";
    const approver = directMessage ? "" : String(data.get("approver") || "").trim();
    const recipientEmail = directMessage ? String(data.get("recipientEmail") || "").trim().toLowerCase() : "";
    const updated = {
      ...(existing || {}),
      id: existing?.id || nextMemoId(),
      title: String(data.get("title") || "").trim() || (status === "Draft" ? "Untitled draft" : ""),
      senderType,
      department: String(data.get("department") || "").trim(),
      author: existing?.author || authorName,
      authorEmail: existing?.authorEmail || currentUserEmail,
      recipientEmail,
      recipient: directMessage ? recipientEmail : approver,
      priority: String(data.get("priority") || "Normal"),
      approver,
      assignedRole: directMessage ? "" : approver,
      delivery: directMessage ? "direct" : "office",
      status,
      body: String(data.get("body") || "").trim(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      history: [...(existing?.history || [])]
    };
    if (status === "Pending Approval" && (!existing || existing.status !== "Pending Approval")) {
      updated.history.push({ action: "Submitted for approval", actor: updated.author, at: now });
    } else if (status === "Sent" && (!existing || existing.status !== "Sent")) {
      updated.history.push({ action: "Sent", actor: updated.author, at: now });
    }
    return updated;
  }

  function saveMemo(status) {
    if (status !== "Draft" && !$("#memo-form").reportValidity()) return;
    const memo = formMemo(status);
    if (status !== "Draft" && (!memo.title || !memo.body)) {
      showToast("Add a subject and memo details before saving.");
      return;
    }
    if (currentIsAdmin && status !== "Draft" && !inboxRoles.includes(memo.assignedRole)) {
      showToast("Select one of the available university offices.");
      return;
    }
    const approvalRequest = currentIsAdmin || memo.delivery === "office";
    if (approvalRequest && status !== "Draft" && !inboxRoles.includes(memo.assignedRole)) {
      showToast("Select an administrator office for this approval request.");
      return;
    }
    if (!approvalRequest && status !== "Draft" &&
      (!memo.recipientEmail || memo.recipientEmail === currentUserEmail)) {
      showToast("Enter a recipient email address other than your own.");
      return;
    }
    if (!approvalRequest && status !== "Draft") {
      try {
        if (!loadAccounts().some((account) => account.email === memo.recipientEmail)) {
          showToast("That email does not belong to a MemoFlow account in this browser.");
          return;
        }
      } catch (error) {
        console.error("Unable to verify the memo recipient.", error);
        showToast("Could not verify the recipient account. Please try again.");
        return;
      }
    }
    if (editingDraftId) memos = memos.map((item) => item.id === memo.id ? memo : item);
    else memos.unshift(memo);
    if (!persist()) return;
    closeModals();
    resetMemoForm();
    activeView = status === "Draft" ? "drafts" : currentIsAdmin ? "inbox" : "sent";
    render();
    showToast(status === "Draft" ? "Draft saved." : approvalRequest ? "Request sent and pending approval." : "Memo sent.");
  }

  function detailHistory(memo) {
    const lastDecision = [...memo.history].reverse().find((event) => event.action === "Approved" || event.action === "Returned for changes");
    return lastDecision;
  }

  function openDetail(id) {
    const memo = memos.find((item) => item.id === id);
    if (!canAccessMemo(memo)) return;
    activeMemoId = id;
    $("#detail-reference").textContent = `${memo.id} · ${memo.department}`;
    $("#detail-title").textContent = memo.title;
    $("#detail-meta").innerHTML = `${escapeHtml(memo.author)} <span>·</span> ${dateLabel(memo.createdAt, { day: "numeric", month: "long", year: "numeric" })} <span>·</span> ${statusMarkup(memo.status)} ${priorityMarkup(memo.priority)}`;
    $("#detail-route").innerHTML = memo.delivery === "direct"
      ? `<span>${escapeHtml(memo.authorEmail || memo.author)}</span><span class="route-arrow">→</span><strong>${escapeHtml(memo.recipientEmail)}</strong>`
      : `<span>${escapeHtml(memo.department || memo.author)}</span><span class="route-arrow">→</span><span>${escapeHtml(roleLabel(memo.recipient))}</span><span class="route-arrow">→</span><strong>${escapeHtml(roleLabel(memo.assignedRole))} inbox</strong>`;
    $("#detail-body").textContent = memo.body;
    const decision = detailHistory(memo);
    const note = $("#decision-note");
    note.classList.toggle("hidden", !decision);
    note.textContent = decision
      ? `${decision.action === "Approved" ? "Approved" : "Returned for changes"} by ${decision.actor || memo.assignedRole}${decision.note ? `: ${decision.note}` : "."}`
      : "";
    const canReview = currentIsAdmin && activeView === "inbox" && memo.delivery !== "direct" &&
      memo.status === "Pending Approval" && memo.assignedRole === activeRole;
    $("#detail-review").classList.toggle("hidden", !canReview);
    $("#detail-footer-hint").textContent = canReview
      ? `Your ${roleLabel(activeRole)} decision will be recorded in the memo history.`
      : memo.status === "Pending Approval"
        ? `Assigned to the ${roleLabel(memo.assignedRole)} inbox.`
        : `Updated ${dateLabel(memo.updatedAt, { day: "numeric", month: "short", year: "numeric" })}`;
    const actions = $("#detail-actions");
    if (canReview) {
      actions.innerHTML = `<button class="button button-danger" data-action="reject">Return for changes</button><button class="button button-primary" data-action="approve">Approve memo <span>✓</span></button>${isCurrentUserMemo(memo) ? '<button class="button button-danger" data-action="delete-memo">Delete memo</button>' : ""}`;
    } else if (memo.status === "Draft" && isCurrentUserMemo(memo)) {
      actions.innerHTML = '<button class="button button-danger" data-action="delete-memo">Delete memo</button><button class="button button-primary" data-action="edit-draft">Edit draft <span>→</span></button>';
    } else if (isCurrentUserMemo(memo)) {
      actions.innerHTML = '<button class="button button-danger" data-action="delete-memo">Delete memo</button><button class="button button-quiet" data-action="close">Close</button>';
    } else {
      actions.innerHTML = '<button class="button button-quiet" data-action="close">Close</button>';
    }
    openModal($("#detail-modal"));
  }

  function decideMemo(action) {
    const memo = memos.find((item) => item.id === activeMemoId);
    if (!currentIsAdmin || activeView !== "inbox" || !memo ||
      memo.status !== "Pending Approval" || memo.assignedRole !== activeRole) return;
    const note = $("#review-note").value.trim();
    const now = new Date().toISOString();
    memo.status = action === "approve" ? "Approved" : "Rejected";
    memo.updatedAt = now;
    memo.history.push({
      action: action === "approve" ? "Approved" : "Returned for changes",
      actor: roleLabel(activeRole),
      at: now,
      ...(note ? { note } : {})
    });
    if (!persist()) return;
    closeModals();
    render();
    showToast(action === "approve" ? "Memo approved." : "Memo returned to the sender.");
  }

  function deleteMemo() {
    const memo = memos.find((item) => item.id === activeMemoId);
    if (!memo || !isCurrentUserMemo(memo)) return;
    const confirmed = window.confirm(`Delete "${memo.title}"? This cannot be undone.`);
    if (!confirmed) return;
    const previousMemos = memos;
    memos = memos.filter((item) => item.id !== activeMemoId);
    if (!persist()) {
      memos = previousMemos;
      return;
    }
    closeModals();
    render();
    showToast("Memo deleted.");
  }

  function handleDocumentClick(event) {
    const passwordToggle = event.target.closest("[data-password-toggle]");
    if (passwordToggle) {
      const passwordInput = passwordToggle.parentElement.querySelector("input");
      const isVisible = passwordInput.type === "password";
      passwordInput.type = isVisible ? "text" : "password";
      passwordToggle.textContent = isVisible ? "Hide" : "Show";
      passwordToggle.setAttribute("aria-label", `${isVisible ? "Hide" : "Show"} password`);
      passwordToggle.setAttribute("aria-pressed", String(isVisible));
      return;
    }
    const composeButton = event.target.closest("[data-compose]");
    if (composeButton) {
      openMemoForm();
      $("#sidebar").classList.remove("open");
      $("#mobile-scrim").classList.remove("show");
      return;
    }
    const inboxButton = event.target.closest("[data-inbox-role]");
    if (inboxButton) {
      if (!currentIsAdmin || inboxButton.dataset.inboxRole !== currentAdminRole) return;
      activeRole = inboxButton.dataset.inboxRole;
      setView("inbox");
      return;
    }
    const adminToggle = event.target.closest("#admin-toggle");
    if (adminToggle) {
      if (!currentIsAdmin) return;
      const expanded = adminToggle.getAttribute("aria-expanded") === "true";
      adminToggle.setAttribute("aria-expanded", String(!expanded));
      $("#admin-role-nav").classList.toggle("hidden", expanded);
      return;
    }
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      setView(viewButton.dataset.view);
      return;
    }
    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      closeModals();
      return;
    }
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const action = actionButton.dataset.action;
      if (action === "approve" || action === "reject") decideMemo(action);
      if (action === "delete-memo") deleteMemo();
      if (action === "edit-draft") {
        const memo = memos.find((item) => item.id === activeMemoId);
        closeModals();
        if (memo) openMemoForm(memo);
      }
      if (action === "close") closeModals();
      return;
    }
    const memoRowElement = event.target.closest("[data-memo-id]");
    if (memoRowElement) openDetail(memoRowElement.dataset.memoId);
  }

  function handleDocumentKeydown(event) {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches(".table-row, .approval-item")) {
      event.preventDefault();
      openDetail(event.target.dataset.memoId);
    }
    if (event.key === "Escape") {
      closeModals();
      $("#sidebar").classList.remove("open");
      $("#mobile-scrim").classList.remove("show");
      $("#search-box")?.classList.remove("search-open");
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      const search = $("#global-search");
      if (window.matchMedia("(max-width: 720px)").matches) $("#search-box").classList.add("search-open");
      search.focus();
    }
  }

  $("#welcome-date").textContent = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long"
  }).format(new Date()).toUpperCase();
  $("#global-search").parentElement.id = "search-box";
  const approverSelect = $("#memo-form").elements.approver;
  inboxRoles.forEach((role) => {
    const option = document.createElement("option");
    option.value = role;
    option.textContent = roleLabel(role);
    approverSelect.append(option);
  });

  $$("[data-auth-view]").forEach((button) => button.addEventListener("click", () => setAuthView(button.dataset.authView)));
  $("#signup-panel").elements.type.addEventListener("change", updateMatricNumberField);
  $("#signin-panel").addEventListener("submit", (event) => signIn(event));
  $("#signup-panel").addEventListener("submit", registerAccount);
  $("#signout-button").addEventListener("click", signOut);
  $("#memo-form").elements.deliveryMode.addEventListener("change", updateMemoRouting);
  $("#memo-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const approvalRequest = currentIsAdmin || $("#memo-form").elements.deliveryMode.value === "approval";
    saveMemo(approvalRequest ? "Pending Approval" : "Sent");
  });
  $("#save-draft-button").addEventListener("click", () => saveMemo("Draft"));
  $("#global-search").addEventListener("input", (event) => {
    searchTerm = event.target.value.trim();
    if (activeView !== "overview") renderList();
  });
  $("#notification-button").addEventListener("click", () => setView("inbox"));
  $("#mobile-menu").addEventListener("click", () => {
    $("#sidebar").classList.add("open");
    $("#mobile-scrim").classList.add("show");
  });
  $("#mobile-scrim").addEventListener("click", () => {
    $("#sidebar").classList.remove("open");
    $("#mobile-scrim").classList.remove("show");
  });
  $("#global-search").parentElement.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 720px)").matches) {
      $("#search-box").classList.add("search-open");
      $("#global-search").focus();
    }
  });
  $$(".modal-backdrop").forEach((backdrop) => backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModals();
  }));
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      memos = loadMemos();
      render();
    }
  });
  restoreSession();
})();