const express = require("express");
const Project = require("../models/Project");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

function findNode(nodes, segments) {
  if (!segments.length) return null;
  const [head, ...rest] = segments;
  const node = nodes.find((n) => n.name === head);
  if (!node) return null;
  if (rest.length === 0) return node;
  if (node.kind !== "folder" || !node.children) return null;
  return findNode(node.children, rest);
}

function findParent(nodes, segments) {
  if (segments.length <= 1) return nodes;
  const parentSegs = segments.slice(0, -1);
  const parent = findNode(nodes, parentSegs);
  if (!parent || parent.kind !== "folder") return null;
  if (!parent.children) parent.children = [];
  return parent.children;
}

router.get("/", async (req, res) => {
  try {
    const projects = await Project.findByOwner(req.userId);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to list projects" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Project name is required" });
    }
    const project = new Project({
      ownerId: req.userId,
      name: name.trim(),
      description: description || "",
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Project name already exists" });
    }
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to get project" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const allowed = [
      "name",
      "description",
      "mainClassPath",
      "lastOpenedFile",
      "isPublic",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await Project.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!result) return res.status(404).json({ error: "Project not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

router.post("/:id/tree/file", async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath)
      return res.status(400).json({ error: "File path is required" });

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const segments = filePath.split("/").filter(Boolean);
    const fileName = segments.pop();
    let container = project.tree;

    for (const seg of segments) {
      let folder = container.find((n) => n.name === seg && n.kind === "folder");
      if (!folder) {
        folder = { name: seg, kind: "folder", children: [] };
        container.push(folder);
      }
      if (!folder.children) folder.children = [];
      container = folder.children;
    }

    const existing = container.find((n) => n.name === fileName);
    if (existing) {
      return res.status(409).json({ error: "File already exists" });
    }

    container.push({ name: fileName, kind: "file", content: content || "" });
    project.markModified("tree");
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to create file" });
  }
});

router.post("/:id/tree/folder", async (req, res) => {
  try {
    const { path: folderPath } = req.body;
    if (!folderPath)
      return res.status(400).json({ error: "Folder path is required" });

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const segments = folderPath.split("/").filter(Boolean);
    let container = project.tree;

    for (const seg of segments) {
      let folder = container.find((n) => n.name === seg && n.kind === "folder");
      if (!folder) {
        folder = { name: seg, kind: "folder", children: [] };
        container.push(folder);
      }
      if (!folder.children) folder.children = [];
      container = folder.children;
    }

    project.markModified("tree");
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to create folder" });
  }
});

router.put("/:id/tree/file", async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath)
      return res.status(400).json({ error: "File path is required" });

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const segments = filePath.split("/").filter(Boolean);
    const node = findNode(project.tree, segments);
    if (!node || node.kind !== "file") {
      return res.status(404).json({ error: "File not found" });
    }

    node.content = content !== undefined ? content : node.content;
    project.markModified("tree");
    await project.save();
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update file" });
  }
});

router.delete("/:id/tree/node", async (req, res) => {
  try {
    const { path: nodePath } = req.body;
    if (!nodePath) return res.status(400).json({ error: "Path is required" });

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const segments = nodePath.split("/").filter(Boolean);
    const name = segments[segments.length - 1];
    const parentList = findParent(project.tree, segments);
    if (!parentList) return res.status(404).json({ error: "Path not found" });

    const idx = parentList.findIndex((n) => n.name === name);
    if (idx === -1) return res.status(404).json({ error: "Node not found" });

    parentList.splice(idx, 1);
    project.markModified("tree");
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete node" });
  }
});

router.post("/:id/tree/rename", async (req, res) => {
  try {
    const { path: nodePath, newName } = req.body;
    if (!nodePath || !newName) {
      return res.status(400).json({ error: "Path and newName are required" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const segments = nodePath.split("/").filter(Boolean);
    const node = findNode(project.tree, segments);
    if (!node) return res.status(404).json({ error: "Node not found" });

    node.name = newName.trim();
    project.markModified("tree");
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to rename" });
  }
});

module.exports = router;
