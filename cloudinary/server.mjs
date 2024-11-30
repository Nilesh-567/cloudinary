// Import dependencies
/*
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

dotenv.config(); // Load environment variables

// Initialize Express app
const app = express();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Upload directory
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename); // Save with unique filename
  },
});

const upload = multer({ "storage" : storage});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_URL.split("@")[1], // Extract cloud name
  api_key: process.env.CLOUDINARY_URL.split(":")[1].split("//")[1], // Extract API key
  api_secret: process.env.CLOUDINARY_URL.split(":")[2].split("@")[0], // Extract API secret
});

// API Endpoint
app.post("/", upload.single("myfile"), async (req, res) => {
  try {
    const filePath = req.file.path; // Path of uploaded file

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "uploads", // Optional: Specify folder in Cloudinary
    });

    const imageUrl = result.secure_url; // Cloudinary-generated URL

    // Send the URL as a response
    res.status(200).json({ url: imageUrl });

    // Delete file from local folder after uploading to Cloudinary
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
      else console.log("Temporary file deleted successfully.");
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "An error occurred while processing the file." });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
*/ 



import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { checkConnection } from "./db.js";

dotenv.config();

const app = express();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ "storage" : storage});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_URL.split("@")[1],
  api_key: process.env.CLOUDINARY_URL.split(":")[1].split("//")[1],
  api_secret: process.env.CLOUDINARY_URL.split(":")[2].split("@")[0],
});

// Endpoint to upload file, store URL in MongoDB, and delete temporary file
app.post("/", upload.single("myfile"), async (req, res) => {
  const { client,db,collection }  = await checkConnection();
  try {
    const filePath = req.file.path;

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "uploads",
    });

    const fileData = {
      id: uuidv4(), // Generate unique ID
      url: result.secure_url, // Cloudinary URL
      size: req.file.size, // File size in bytes
      type: req.file.mimetype, // File MIME type
      name: req.file.originalname, // Original file name
    };

    // Insert file details into MongoDB
    await collection.insertOne(fileData);
    console.log("image inserted in database"); 
    // Delete file from uploads folder
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
      else console.log("Temporary file deleted successfully.");
    });

    // Respond with the Cloudinary URL
    res.status(200).json({ message: "File uploaded and stored in MongoDB", url: fileData.url });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "An error occurred while processing the file." });
  }
});

// Endpoint to fetch the latest file record from MongoDB
app.post("/store-mongodb", async (req, res) => {
  const { client,db,collection }  = await checkConnection();

  try {
    const latestFile = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    res.status(200).json(latestFile[0]); // Return the latest file record
  } catch (error) {
    console.error("Error fetching data from MongoDB:", error.message);
    res.status(500).json({ error: "An error occurred while fetching data from MongoDB." });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
