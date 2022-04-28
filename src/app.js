import express from "express";
import session from "express-session";

import collectionRouter from "./routes/collection";
import docRouter from "./routes/doc";

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  console.log(req.method, fullUrl, "body:", req.body);
  next();
});

app.use("/collection", collectionRouter);
app.use("/doc", docRouter);

export default app;
