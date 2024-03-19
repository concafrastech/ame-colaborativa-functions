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
  let apiUrl = process.env.SANDBOX_API_PAGSEGURO;
  let token = process.env.SANDBOX_TOKEN_PAGSEGURO;

  if (req.body.isProduction) {
    apiUrl = process.env.API_PAGSEGURO;
    token = process.env.TOKEN_PAGSEGURO;
  }

  await db
    .collection("checkouts")
    .add(req.body)
    .then(() => {
      let clientServerOptions = {
        uri: `${apiUrl}/checkouts`,
        body: JSON.stringify(req.body.checkout),
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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

app.post("/success", async (req, res) => {
  logger.info("Iniciando checkout success.");
  let { body } = req;

  await db
    .collection("checkouts-success")
    .add(body)
    .then(() => {
      logger.info("Response da pagseguro salvo com sucesso.");
      res.status(201).json({
        data: "Inserido com sucesso.",
      });
    });
});

exports.checkouts = functions.https.onRequest(app);
