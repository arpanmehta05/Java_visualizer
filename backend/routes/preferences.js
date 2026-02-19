const express = require("express");
const Preferences = require("../models/Preferences");

const router = express.Router();

router.get("/:sessionId", async (req, res) => {
  try {
    const prefs = await Preferences.findOne({
      sessionId: req.params.sessionId,
    });
    if (!prefs)
      return res.json({
        theme: "dark",
        editorFontSize: 13,
        splitLayout: { editorWidth: 55, rightPanelSplit: 50 },
      });
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:sessionId", async (req, res) => {
  try {
    const { theme, editorFontSize, splitLayout } = req.body;
    const update = {};
    if (theme) update.theme = theme;
    if (editorFontSize) update.editorFontSize = editorFontSize;
    if (splitLayout) update.splitLayout = splitLayout;

    const prefs = await Preferences.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { $set: update },
      { new: true, upsert: true, runValidators: true },
    );
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
