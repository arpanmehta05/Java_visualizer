const express = require("express");
const Snippet = require("../models/Snippet");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { q, limit = 50, skip = 0 } = req.query;
    const filter = q ? { $text: { $search: q } } : {};
    const snippets = await Snippet.find(filter)
      .sort({ updatedAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .select("title description tags language updatedAt");
    const total = await Snippet.countDocuments(filter);
    res.json({ snippets, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, code, description, tags } = req.body;
    if (!title || !code) {
      return res.status(400).json({ error: "Title and code are required" });
    }
    const snippet = await Snippet.create({ title, code, description, tags });
    res.status(201).json(snippet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, code, description, tags } = req.body;
    const snippet = await Snippet.findByIdAndUpdate(
      req.params.id,
      { title, code, description, tags },
      { new: true, runValidators: true },
    );
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findByIdAndDelete(req.params.id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
