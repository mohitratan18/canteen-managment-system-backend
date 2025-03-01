const express = require('express');
const router = express.Router();
const axios = require('axios')

router.use('/:id',async(req,res)=>{
    try {
        const { id } = req.params;
        const url = `https://sandbox.cashfree.com/pg/orders/${id}`;
    
        const response = await axios.get(url, {
          headers: {
            "x-client-id": process.env.CASHFREE_APP_ID, // Use environment variables
            "x-client-secret": process.env.CASHFREE_SECRET_KEY,
            "Content-Type": "application/json",
            "x-api-version": "2023-08-01",
          },
        });
    
        res.json(response.data); // Send response back to frontend
      } catch (error) {
        res.status(error.response?.status || 500).json({
          message: error.message,
          error: error.response?.data,
        });
      }
})

module.exports = router;