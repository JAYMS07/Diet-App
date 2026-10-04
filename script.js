const btn = document.getElementById("go");
const status = document.getElementById("status");
const results = document.getElementById("results");

btn.addEventListener("click", async () => {
  const ingredients = document.getElementById("ingredients").value
    .split(",").map((s) => s.trim()).filter(Boolean);
  const restrictions = [...document.querySelectorAll(".checks input:checked")].map((c) => c.value);

  status.className = "";
  results.innerHTML = "";
  if (!ingredients.length) {
    status.className = "error";
    status.textContent = "Add at least one ingredient, separated by commas.";
    return;
  }

  btn.disabled = true;
  status.textContent = "Thinking up recipes. This can take a minute on a local model.";

  try {
    const res = await fetch("/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, restrictions }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    status.textContent = data.recipes.length
      ? (data.removed ? `${data.removed} recipe(s) removed by the safety filter.` : "")
      : "No safe recipes this time. Try again or add more ingredients.";
    data.recipes.forEach(renderCard);
  } catch (err) {
    status.className = "error";
    status.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

function renderCard(r) {
  const card = document.createElement("article");
  card.className = "card";
  const h = document.createElement("h3");
  h.textContent = r.name;
  const t = document.createElement("div");
  t.className = "time";
  t.textContent = r.time || "";
  const ul = document.createElement("ul");
  (r.ingredients || []).forEach((i) => ul.append(Object.assign(document.createElement("li"), { textContent: i })));
  const ol = document.createElement("ol");
  (r.steps || []).forEach((s) => ol.append(Object.assign(document.createElement("li"), { textContent: s })));
  card.append(h, t, ul, ol);
  results.append(card);
}