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
  logger.info("Iniciando criação de pedido");
  logger.info(req.body);
  let apiUrl = process.env.SANDBOX_API_PAGSEGURO;
  let token = process.env.SANDBOX_TOKEN_PAGSEGURO;

  if (req.body.isProduction) {
    apiUrl = process.env.API_PAGSEGURO;
    token = process.env.TOKEN_PAGSEGURO;
  }

  await db
    .collection("orders")
    .add(req.body)
    .then(() => {
      let clientServerOptions = {
        uri: `${apiUrl}/orders`,
        body: JSON.stringify(req.body.order),
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      request(clientServerOptions, async function (error, response) {
        let body = JSON.parse(response.body);
        logger.info("Response PagSeguro: ", body);

        await db
          .collection("orders-success")
          .add(body)
          .then(() => {
            if (body.error_messages) {
              res.status(500).json({
                data: response.body,
              });
            } else {
              res.status(201).json({
                data: response.body,
              });
            }
          });
      });
    });
});

exports.orders = functions.https.onRequest(app);
