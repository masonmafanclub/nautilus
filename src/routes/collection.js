import express from "express";
import crypto from "crypto";
import { backend, docs } from "../sharedb";

const router = express.Router();

// fancy wrapper around integer
class Version {
  constructor() {
    this.val = 0;
  }
  equals(other) {
    return this.val == other;
  }
  inc() {
    this.val++;
  }
}

// create
router.post("/create", (req, res) => {
  const { name, docid } = req.body;
  if (!name || !docid)
    return res.status(400).json({ error: true, description: "missing info" });

  var doc = backend.connect().get("document", docid);
  doc.create([], "rich-text");
  docs.set(docid, {
    version: new Version(),
    name,
    clients: new Map(),
    last_modified: Date.now(),
  });

  return res.status(200).json({ status: "OK" });
});

// delete
router.post("/delete", (req, res) => {
  const { docid } = req.body;

  if (!docid) {
    return res.status(400).json({ error: true, description: "missing info" });
  }

  var doc = backend.connect().get("document", docid);
  doc.destroy();

  docs.delete(docid);

  return res.status(200).json({ status: "OK" });
});

// list
// TODO: move this somewhere else -- since this server will be sharded eventually
router.get("/list", (req, res) => {
  var sortedDocs = Array.from(docs.keys()).sort(
    (a, b) => docs.get(b).last_modified - docs.get(a).last_modified
  );
  var ret = sortedDocs
    .slice(0, 10)
    .map((docid) => ({ id: docid, name: docs.get(docid).name }));

  res.json(ret);
});

export default router;
