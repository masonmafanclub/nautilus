import express from "express";
import crypto from "crypto";
import throttle from "lodash/throttle";
import { backend, docs, elastic } from "../sharedb";

var QuillDeltaToHtmlConverter =
  require("quill-delta-to-html").QuillDeltaToHtmlConverter;

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
router.post("/create", async (req, res) => {
  const { name, docid } = req.body;
  if (!name || !docid)
    return res.status(400).json({ error: true, description: "missing info" });

  var doc = backend.connect().get("document", docid);
  doc.create([], "rich-text");
  elastic.index({
    index: "cse356",
    id: docid,
    document: {
      name: name,
      text: "",
      suggest: "",
    },
  });
  docs.set(docid, {
    version: new Version(),
    name,
    clients: new Map(),
    last_modified: Date.now(),
    throttledUpdate: throttle(
      () => {
        console.log("in throttle");
        doc.fetch(() => {
          var converter = new QuillDeltaToHtmlConverter(doc.data.ops, {}); // get doc text upon throttle
          console.log(converter.convert());
          console.log(doc.data);
          elastic.update({
            index: "cse356",
            id: docid,
            script: {
              lang: "painless",
              source:
                "ctx._source.text =  params.text; ctx._source.suggest = params.text",
              params: { text: converter.convert().replace(/<[^>]*>?/gm, "") },
            },
          });
        });
      },
      1000,
      { trailing: false }
    ),
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
  elastic.delete({ index: "cse356", id: docid });
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
