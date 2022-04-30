import express from "express";
import { backend, docs, elastic } from "../sharedb";
const router = express.Router();

var QuillDeltaToHtmlConverter =
  require("quill-delta-to-html").QuillDeltaToHtmlConverter;

// connect
router.get("/connect/:docid/:uid", function (req, res, next) {
  const { uid, docid } = req.params;

  if (!docs.has(docid))
    return res.status(400).json({ status: "error no doc exists" });

  console.log(`/connect/${req.params.docid}/${req.params.uid} start`);
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);
  res.flushHeaders();

  const { version, clients, throttledUpdate } = docs.get(docid);

  if (!clients.has(uid)) {
    clients.set(uid, {
      res,
      doc: backend.connect().get("document", docid),
    });
  }

  const doc = clients.get(uid).doc;

  doc.subscribe((err) => {
    if (err) throw err;

    doc.fetch();
    res.write(
      `data: ${JSON.stringify({
        content: doc.data.ops,
        version: version.val,
      })}`
    );
    res.write("\n\n");

    doc.on("op", (op, source) => {
      if (source) {
        res.write(`data: ${JSON.stringify({ ack: op })}`);
        res.write("\n\n");
      } else {
        res.write(`data: ${JSON.stringify(op)}`);
        res.write("\n\n");
      }
    });
  });

  res.on("close", () => {
    console.log(`/connect/${req.params.id} dropped`);
    clients.delete(uid);
    doc.unsubscribe(); // TODO: see if this still works with doc.del()
    res.end();
  });
});

router.post("/op/:docid/:uid", function (req, res, next) {
  const { version, op } = req.body;
  const { uid, docid } = req.params;

  if ((version !== 0 && !version) || !op)
    return res.status(400).json({ error: true, description: "missing info" });

  const { version: docversion, clients } = docs.get(docid);
  const doc = clients.get(uid).doc;

  if (docversion.equals(version)) {
    docversion.inc();
    docs.get(docid).last_modified = Date.now();
    doc.submitOp(op, (err) => {
      if (err) console.log(err);
      else docs.get(docid).throttledUpdate();
    });
    res.json({ status: "ok" });
  } else {
    res.json({ status: "retry" });
  }
});

router.post("/presence/:docid/:uid", async function (req, res) {
  const { index, length, name } = req.body;
  const { uid, docid } = req.params;

  if (!index || !length || !name)
    return res.status(400).json({ error: true, description: "missing info" });

  if (!req.body) return;

  const clients = docs.get(docid).clients;

  clients.forEach((client, clientuid) => {
    if (clientuid !== uid) {
      client.res.write(
        `data: ${JSON.stringify({
          presence: {
            id: uid,
            cursor: {
              index: req.body.index,
              length: req.body.length,
              name: req.body.name,
            },
          },
        })}\n\n`
      );
    }
  });

  res.json({});
});

router.get("/get/:docid/:uid", function (req, res, next) {
  const { uid, docid } = req.params;

  const clients = docs.get(docid).clients;

  const doc = clients.get(uid).doc;
  doc.fetch();

  console.log(doc.data.ops);
  var converter = new QuillDeltaToHtmlConverter(doc.data.ops, {});
  console.log(`/doc/${req.params.uid} ${converter.convert()}`);
  res.send(converter.convert());
});

router.get("/edit/:docid", function (req, res, next) {
  res.render("edit", { docid: req.params.docid });
});

export default router;
