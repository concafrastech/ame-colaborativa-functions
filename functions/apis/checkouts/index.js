const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const request = require("request");

// Variáveis utilitárias
const db = admin.firestore();
const logger = functions.logger;
const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.post("/", async (req, res) => {
  logger.info("Iniciando criação de checkout.");

  await db
    .collection("checkouts")
    .add(req.body)
    .then(() => {
      let clientServerOptions = {
        uri: `${process.env.SANDBOX_API_PAGSEGURO}/checkouts`,
        body: JSON.stringify(req.body),
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SANDBOX_TOKEN_PAGSEGURO}`,
          "Content-Type": "application/json",
        },
      };

      request(clientServerOptions, function (error, response) {
        let body = JSON.parse(response.body);

        if (body.error_messages) {
          res.status(500).json({
            data: response.body,
          });
        } else {
          logger.info("Checkout criado com sucesso");
          res.status(201).json({
            data: response.body,
          });
        }
      });
    });
});

exports.checkouts = functions.https.onRequest(app);
