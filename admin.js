// Import required packages and initialize Firebase Admin SDK
require("dotenv").config();
const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

// Define the POST route to add a new item
router.post("/addNewItem", async (req, res) => {
  try {
    // Destructure and validate incoming request body
    const { name, price, description, category, image, isAvailable } = req.body;

    if (!name || !price || !description || !category || !image) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // Construct the new item object
    const newItem = {
      name: name.trim(),
      price: parseFloat(price), // Convert price to a float
      description: description.trim(),
      category: category.trim(),
      image: image.trim(),
      isAvailable: isAvailable === true || isAvailable === "true", // Convert to boolean
    };

    // Add the item to Firebase Realtime Database
    const db = admin.database(); // Using admin.database() for Firebase >= 10
    const ref = db.ref("items"); // Path in the database
    const newRef = ref.push(); // Create a unique key for the new item
    newItem.id = newRef.key; // Add the generated key to the newItem object
    await newRef.set(newItem);

    // Respond with success and the generated item ID
    res
      .status(201)
      .json({ message: "Item added successfully", itemId: newRef.key });
  } catch (error) {
    console.error("Error adding item to Firebase:", error);
    res
      .status(500)
      .json({ message: "Error adding item", error: error.message });
  }
});

// Fetch Items to display.
router.get("/getItems", async (req, res) => {
  try {
    const db = admin.database();
    const itemsRef = db.ref("items");
    const snapshot = await itemsRef.once("value");
    const items = snapshot.val();

    if (items) {
      // Convert to array if it's an object, otherwise keep as array.
      const itemsArray = Array.isArray(items) ? items : Object.values(items);
      res.json(itemsArray);
    } else {
      res.json([]); // Return an empty array if no items are found
    }
  } catch (error) {
    console.error("Error fetching items:", error);
    res
      .status(500)
      .json({ message: "Error fetching items", error: error.message });
  }
});

router.post("/toogleAvailability", async (req, res) => {
  const itemId = req?.body?.id;
  try {
    if (!itemId.trim()) {
      return res.status(400).json({ message: "Item ID is required" });
    }
    const db = admin.database();
    const itemsRef = db.ref("items");
    const itemRef = itemsRef.child(itemId);
    const item = await itemRef.once("value");
    if (item.exists()) {
      const isAvailable = item.val().isAvailable;
      itemRef.update({ isAvailable: !isAvailable });
      return res
        .status(200)
        .json({ message: `Item ${itemId} availability toggled` });
    } else {
      return res.status(404).json({ message: `Item ${itemId} not found` });
    }
  } catch (error) {
    res.status(500).json({ message: "Error ", error: error.message });
  }
});

router.post("/deleteItem", async (req, res) => {
  const itemId = req?.body?.id;
  try {
    if (!itemId.trim()) {
      return res.status(400).json({ message: "Item ID is required" });
    }
    const db = admin.database();
    const itemsRef = db.ref("items");
    const itemRef = itemsRef.child(itemId);
    const item = await itemRef.once("value");
    if (item.exists()) {
      itemRef.remove();
      return res.status(200).json({ message: `Item ${itemId} deleted` });
    } else {
      return res.status(404).json({ message: `Item ${itemId} not found` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching items", error: error.message });
  }
});

router.post("/updateItem", async (req, res) => {
  const itemId = req?.body?.id;
  const itemData = req?.body?.itemData;
  try {
    if (!itemId.trim() || !itemData) {
      return res
        .status(400)
        .json({ message: "Item ID and item data are required" });
    }
    const db = admin.database();
    const itemsRef = db.ref("items");
    const itemRef = itemsRef.child(itemId);
    const item = await itemRef.once("value");
    if (item.exists()) {
      itemRef.update(itemData);
      return res.status(200).json({ message: `Item ${itemId} updated` });
    } else {
      return res.status(404).json({ message: `Item ${itemId} not found` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating item", error: error.message });
  }
});

router.post("/addbills", async (req, res) => {
  const { bill } = req.body;

  try {
    const db = admin.firestore();
    const billsRef = db.collection("bills");
    const newBillRef = await billsRef.add(bill);
    res
      .status(201)
      .json({ message: "Bill added successfully", billId: newBillRef.id });
  } catch (error) {
    console.error("Error adding bill to Firebase:", error);
    res
      .status(500)
      .json({ message: "Error adding bill", error: error.message });
  }
});

router.get("/getbills", async (req, res) => {
  try {
    const db = admin.firestore();
    const billsSnapshot = await db.collection("bills").get();
    const bills = billsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })); // Convert Firestore documents to plain objects
    // console.log(billsSnapshot.docs[0]);
    res.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

router.get("/getSales", async (req, res) => {
  const date = new Date(Date.now());
  const today = date.toDateString();
  const salesData = [];

  try {
    const db = admin.firestore();
    const bills = await db.collection("bills").get();

    const billsSnapshot = bills.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    let sales = 0;
    let totalOrders =0;
    billsSnapshot.forEach((bill) => {
      let billCreatedAtDate = new Date(bill.createdAt).toDateString();
      if (billCreatedAtDate === today) {
        totalOrders++;
        sales += bill.total;
      }
    });

    //Fetch last 6 days sales
    for (let i = 0; i < 6; i++) {
      const pastDate = new Date();
      pastDate.setDate(date.getDate() - i);
      const day = String(pastDate.getDate()).padStart(2, "0");
      const month = String(pastDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
      const year = pastDate.getFullYear();
      const formattedDate = `${month}-${day}-${year}`;

      let dailySales = 0;
      billsSnapshot.forEach((bill) => {
        let billCreatedAtDate = new Date(bill.createdAt).toDateString();
        const billDay = String(new Date(bill.createdAt).getDate()).padStart(
          2,
          "0"
        );
        const billMonth = String(
          new Date(bill.createdAt).getMonth() + 1
        ).padStart(2, "0");
        const billYear = new Date(bill.createdAt).getFullYear();
        const formattedBillDate = `${billMonth}-${billDay}-${billYear}`;

        if (formattedBillDate === formattedDate) {
          dailySales += bill.total;
        }
      });
      salesData.push({ date: formattedDate, sales: dailySales });
    }

    salesData.reverse(); // Reverse to show most recent date first

    res.json({ todaySales: sales, salesData ,totalOrders });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});

module.exports = router;
