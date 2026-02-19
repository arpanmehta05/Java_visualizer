const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    code: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    language: {
      type: String,
      default: "java",
      enum: ["java"],
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true },
);

snippetSchema.index({ title: "text", tags: 1 });

module.exports = mongoose.model("Snippet", snippetSchema);
