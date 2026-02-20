const express = require("express");
const archiver = require("archiver");
const Project = require("../models/Project");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

function addNodesToArchive(archive, nodes, prefix) {
  for (const node of nodes) {
    const entryPath = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.kind === "folder") {
      archive.append("", { name: entryPath + "/" });
      if (node.children && node.children.length) {
        addNodesToArchive(archive, node.children, entryPath);
      }
    } else {
      archive.append(node.content || "", { name: entryPath });
    }
  }
}

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, "_");

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}.zip"`,
    });

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      res.status(500).end();
    });
    archive.pipe(res);

    addNodesToArchive(archive, project.tree, "");

    archive.append(
      JSON.stringify(
        {
          name: project.name,
          mainClassPath: project.mainClassPath,
          description: project.description,
        },
        null,
        2,
      ),
      { name: ".jdi-project.json" },
    );

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export project" });
    }
  }
});

module.exports = router;
