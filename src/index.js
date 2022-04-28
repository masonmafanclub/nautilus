import http from "http";

import app from "./app";

var server = http.createServer(app);
server.listen(3000);
server.on("error", onError);
server.on("listening", onListening);

function onError(error) {
  throw error;
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Listening on " + bind);
}
