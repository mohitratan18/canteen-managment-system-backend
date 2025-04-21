const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3069;
const corsOptions = {
  origin: ['*'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use("/api/auth", require("./authController"));
app.use("/api/admin",require("./admin"));
app.use("/api/payment",require('./payment'));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
