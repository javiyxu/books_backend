const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins and methods
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create connection pool optimized for local runtime and serverless scaling
const pool = mysql.createPool({
  host: "sql.freedb.tech",
  user: "u_F6kDkt",
  password: "8pSPW3GVwker",
  database: "freedb_CsO0SJLW",
  connectionLimit: 5,        // Tuned down slightly to prevent scaling issues on Vercel
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Root welcome message path to prevent base URL 404 pages
app.get("/", (req, res) => {
  res.status(200).send("🚀 Books database backend API is running smoothly!");
});

// Test database connection gracefully without breaking the initialization loop
pool.getConnection((err, conn) => {
  if (err) {
    console.error(" Database Connection Error: " + err.message);
    return;
  }
  console.log("✅ Connected to MySQL database successfully.");
  conn.release();
});

// ---- READ: Get all books ----
app.get("/api/books", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  pool.query("SELECT * FROM books ORDER BY id DESC", (err, rows) => {
    if (err) {
      console.error("Read Error:", err.message);
      return res.status(500).json({ error: "Internal server error reading books." });
    }
    res.status(200).json(rows);
  });
});

// ---- CREATE: Insert a new book ----
app.post("/api/books", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  // Accept yearPub to perfectly align with Flutter's payload parameter mapping
  const { title, author, yearPub } = req.body;

  if (!title || !author || !yearPub) {
    return res.status(400).json({ error: "title, author, and yearPub are all required." });
  }

  pool.query(
    "INSERT INTO books (title, author, year_published) VALUES (?, ?, ?)",
    [title, author, parseInt(yearPub, 10)],
    (err, result) => {
      if (err) {
        console.error("Write Error:", err.message);
        return res.status(500).json({ error: "Internal server error saving book." });
      }
      res.status(201).json({
        msg: "Successfully inserted!",
        insertedId: result.insertId,
      });
    }
  );
});

// Only invoke direct port listener if running in a non-production (local) environment. 
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running and listening locally on port ${PORT}`);
  });
}

// Export the app module cleanly for Vercel deployment engine
module.exports = app;
