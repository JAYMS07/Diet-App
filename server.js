import express from "express";
import { Ollama } from "ollama";

const app = express();
const ollama = new Ollama(); // talks to http://localhost:11434
const MODEL = "gemma3";      // change to "llama3.2" if you prefer

app.use(express.json());
app.use(express.static("public")); // serves the frontend

// Hardcoded safety list. Never trust the AI alone with allergies.
// Hacktoberfest idea: let contributors add more allergens and synonyms here.
const BANNED = {
  nuts: ["almond", "cashew", "peanut", "walnut", "pistachio", "hazelnut", "pecan"],
  lactose: ["milk", "cheese", "butter", "cream", "yogurt", "paneer", "ghee"],
  vegetarian: ["chicken", "beef", "fish", "pork", "lamb", "bacon", "egg", "shrimp"],
  gluten: ["wheat", "flour", "bread", "pasta", "barley", "noodle"],
};

function isSafe(recipe, restrictions) {
  const text = [recipe.name, ...(recipe.ingredients || [])].join(" ").toLowerCase();
  return !restrictions.some((r) =>
    (BANNED[r] || []).some((word) => text.includes(word))
  );
}

app.post("/recipes", async (req, res) => {
  const { ingredients = [], restrictions = [] } = req.body;
  if (!ingredients.length) return res.status(400).json({ error: "Add at least one ingredient." });

  const prompt = `Suggest 3 recipes using mostly: ${ingredients.join(", ")}.
Restrictions: ${restrictions.join(", ") || "none"}. Never include foods that break them.
Reply ONLY as JSON: {"recipes":[{"name":"","ingredients":[],"steps":[],"time":""}]}`;

  try {
    const r = await ollama.chat({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      format: "json",
    });
    const data = JSON.parse(r.message.content);
    const all = data.recipes || [];
    const safe = all.filter((rec) => isSafe(rec, restrictions));
    res.json({ recipes: safe, removed: all.length - safe.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reach Ollama. Is it running?" });
  }
});

app.listen(3000, () => console.log("Open http://localhost:3000"));
