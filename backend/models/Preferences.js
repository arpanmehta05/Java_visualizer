const mongoose = require("mongoose");

const preferencesSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ["dark", "light", "high-contrast"],
      default: "dark",
    },
    editorFontSize: {
      type: Number,
      default: 13,
      min: 10,
      max: 24,
    },
    splitLayout: {
      editorWidth: { type: Number, default: 55 },
      rightPanelSplit: { type: Number, default: 50 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Preferences", preferencesSchema);
