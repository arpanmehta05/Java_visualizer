const mongoose = require("mongoose");

const fileNodeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["file", "folder"], required: true },
    content: { type: String, default: "" },
    children: { type: [this], default: undefined },
  },
  { _id: true },
);

fileNodeSchema.add({
  children: [fileNodeSchema],
});

const projectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    description: {
      type: String,
      default: "",
      maxlength: 512,
    },
    mainClassPath: {
      type: String,
      default: "Main.java",
    },
    tree: {
      type: [fileNodeSchema],
      default: () => [
        {
          name: "src",
          kind: "folder",
          children: [
            {
              name: "Main.java",
              kind: "file",
              content: [
                "public class Main {",
                "    public static void main(String[] args) {",
                '        System.out.println("Hello, World!");',
                "    }",
                "}",
              ].join("\n"),
            },
          ],
        },
      ],
    },
    lastOpenedFile: {
      type: String,
      default: "src/Main.java",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

projectSchema.index({ ownerId: 1, name: 1 }, { unique: true });
projectSchema.index({ updatedAt: -1 });

projectSchema.statics.findByOwner = function (ownerId) {
  return this.find({ ownerId })
    .select("name description mainClassPath updatedAt isPublic")
    .sort({ updatedAt: -1 })
    .lean();
};

module.exports = mongoose.model("Project", projectSchema);
