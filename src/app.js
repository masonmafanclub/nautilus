import express from "express";
import session from "express-session";

import collectionRouter from "./routes/collection";
import docRouter from "./routes/doc";
import indexRouter from "./routes/index";

var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use(function (req, res, next) {
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  console.log(req.method, fullUrl, "body:", req.body);
  next();
});

app.use("/collection", collectionRouter);
app.use("/doc", docRouter);
app.use("/index", indexRouter);

export default app;
