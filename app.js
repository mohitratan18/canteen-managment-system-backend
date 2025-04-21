const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3069;
const corsOptions = {
  origin: '*', // Allow requests from React development server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow credentials (cookies, authorization headers)
  optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use("/api/auth", require("./authController"));
app.use("/api/admin",require("./admin"));
app.use("/api/payment",require('./payment'));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
