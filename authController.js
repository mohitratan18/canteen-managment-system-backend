require('dotenv').config();
const admin = require("firebase-admin");
const firebaseConfig = {
  credential: admin.credential.cert({
    "type": process.env.FIREBASE_TYPE,
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY,
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
    "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN
  }),
};


admin.initializeApp(firebaseConfig);
const router = require("express").Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user already exists in Firestore
    const db = admin.firestore();
    const usersRef = db.collection("Users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.exists) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    // Create the user record in Firestore
    const userRecord = await db.collection("Users").add({
      email,
      password, // Assuming you want to store the password directly for simplicity
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res
      .status(201)
      .json({ message: "User created successfully", uid: userRecord.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    const db = admin.firestore();
    const usersRef = db.collection("Users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty) {
      // Check if the query returned any documents
      res.status(401).json({ error: "User not found" });
      return;
    }
    snapshot.forEach((doc) => {
      const userRecord = doc.data();
      if (userRecord.password === password) {
        admin
          .auth()
          .createCustomToken(doc.id)
          .then((token) => {
            res.status(200).json({ message: "Login successful", token });
          })
          .catch((error) => {
            res.status(500).json({ error: error.message });
          });
        return;
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const db = admin.firestore();
      const adminsRef = db.collection("Admin");
      const snapshot = await adminsRef.where("email", "==", email).get();
  
      if (snapshot.empty) {
        return res.status(401).json({ error: "Admin not found" });
      }

      snapshot.forEach((doc) => {
        const adminRecord = doc.data();
        if (adminRecord.password === password) {
          admin.auth().createCustomToken(doc.id)
            .then((token) => {
              res.status(200).json({ message: "Admin login successful", token, isAdmin:true });
            })
            .catch((error) => {
              res.status(500).json({ error: error.message });
            });
  
            return;
  
        }else {
            return res.status(401).json({error: "Invalid Credentials"}) 
        }
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

module.exports = router;
