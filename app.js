const schemeData = [
  {
    id: "pmegp", name: "PMEGP", fullName: "Prime Minister's Employment Generation Programme", icon: "₹", description: "Financial support to help you set up a new micro-enterprise.", benefit: "Margin money subsidy up to 35%", tags: ["New businesses", "Up to ₹50 lakh", "Rural & urban"], eligibility: ["You must be at least 18 years old", "Designed for new micro-enterprises", "Education criteria may apply for larger projects"], score(profile) {
      let value = 74;
      if (profile.stage === "Starting a new business") value += 14;
      if (["SC", "ST", "OBC", "Minority"].some(c => profile.categories.includes(c))) value += 7;
      if (profile.area === "Rural") value += 3;
      return Math.min(value, 98);
    }
  },
  {
    id: "standup", name: "Stand-Up India", fullName: "Stand-Up India Scheme", icon: "↗", description: "Bank loans to support women and SC/ST entrepreneurs starting a greenfield business.", benefit: "Bank loans from ₹10 lakh to ₹1 crore", tags: ["Women / SC / ST", "New businesses", "₹10 lakh – ₹1 crore"], eligibility: ["For women entrepreneurs or people from SC/ST communities", "For a first-time business in manufacturing, services or trading", "Funding requirement should be at least ₹10 lakh"], score(profile) {
      const priority = profile.gender === "Woman" || profile.categories.includes("SC") || profile.categories.includes("ST");
      const amount = Number(profile.funding || 0);
      let value = priority ? 76 : 35;
      if (profile.stage === "Starting a new business") value += 12;
      if (amount >= 500000) value += 8;
      return Math.min(value, 96);
    }
  },
  {
    id: "mudra", name: "Mudra Yojana", fullName: "Pradhan Mantri MUDRA Yojana", icon: "₹", description: "Collateral-free loans for small businesses and self-employed entrepreneurs.", benefit: "Loans up to ₹10 lakh without collateral", tags: ["Small businesses", "No collateral", "All communities"], eligibility: ["Available to non-corporate small business owners", "Suitable for shop, service, manufacturing and trading activities", "Apply through a participating bank or lender"], score(profile) {
      let value = 76;
      if (Number(profile.funding || 0) <= 1500000) value += 12;
      if (["Retail / shop", "Food and hospitality", "Services"].includes(profile.business)) value += 5;
      return Math.min(value, 96);
    }
  },
  {
    id: "vishwakarma", name: "PM Vishwakarma", fullName: "PM Vishwakarma Scheme", icon: "⚒", description: "Recognition, training and financial support for traditional artisans and craftspeople.", benefit: "Training, toolkit support and concessional credit", tags: ["Artisans", "Skill training", "Toolkit support"], eligibility: ["For eligible traditional artisans and craftspeople", "Your business should involve an approved artisan trade", "Aadhaar-based registration is required"], score(profile) {
      let value = profile.business === "Handicraft / artisan work" ? 91 : 42;
      if (profile.area === "Rural") value += 4;
      return Math.min(value, 97);
    }
  }
];

const emptyProfile = { name: "", state: "", age: "", gender: "", categories: [], area: "", business: "", stage: "", funding: "" };
let profile = JSON.parse(localStorage.getItem("schemeSathiProfile") || "null") || { ...emptyProfile };
let currentStep = 1;
let activeApplication = localStorage.getItem("schemeSathiApplication") || "mudra";

const el = (selector) => document.querySelector(selector);
const els = (selector) => [...document.querySelectorAll(selector)];

function hasProfile() { return Boolean(profile.name && profile.business && profile.area); }
function initials(name) { return name.split(" ").filter(Boolean).map(word => word[0]).slice(0, 2).join("").toUpperCase() || "AS"; }
function showToast(message) { const toast = el("#toast"); toast.textContent = message; toast.classList.add("show"); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200); }
function setView(view) {
  els(".view").forEach(section => section.classList.toggle("active", section.id === `${view}View`));
  els(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  el(".sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "schemes") renderSchemes();
  if (view === "applications") renderApplications();
  if (view === "profile") renderProfile();
}

function openModal(id) { const modal = el(`#${id}`); modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); }
function closeModal(id) { const modal = el(`#${id}`); modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }

function updateProfileUI() {
  els(".avatar").forEach(node => node.textContent = initials(profile.name));
  el("#locationLabel").textContent = profile.state || "India";
}

function showProfileStep(step) {
  currentStep = step;
  els(".form-step").forEach(item => item.classList.toggle("active", Number(item.dataset.step) === step));
  el("#stepIndicator").textContent = step;
  const headings = ["Let’s get to know you", "A little more about you", "Tell us about your dream"];
  const descriptions = ["These details help us find the right support.", "This helps us check special eligibility support.", "We’ll use this to make your matches more accurate."];
  el("#profileModalTitle").textContent = headings[step - 1];
  el("#stepDescription").textContent = descriptions[step - 1];
  el("#backButton").hidden = step === 1;
  el("#nextButton").innerHTML = step === 3 ? "See my matches <span>→</span>" : "Continue <span>→</span>";
}

function openProfile() {
  const form = el("#profileForm");
  form.name.value = profile.name;
  form.state.value = profile.state;
  form.age.value = profile.age;
  form.gender.value = profile.gender;
  form.area.value = profile.area;
  form.business.value = profile.business;
  form.stage.value = profile.stage;
  form.funding.value = profile.funding;
  els('input[name="category"]').forEach(input => input.checked = profile.categories.includes(input.value));
  showProfileStep(1);
  openModal("profileModal");
}

function captureProfile() {
  const form = el("#profileForm");
  const values = new FormData(form);
