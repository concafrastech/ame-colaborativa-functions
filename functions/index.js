const admin = require("firebase-admin");
const serviceAccount = require("./service-account/ametech.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const ordersApi = require("./apis/orders");

module.exports = {
  ...ordersApi,
};
