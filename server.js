// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/* ===================================================
   STEP 0 — Load .env Correctly
=================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env")
});

console.log("ENV TEST:", process.env.PG_HOST, process.env.PG_USER, process.env.PG_DATABASE);

const { Pool, Client } = pkg;
const app = express();
app.use(bodyParser.json());
app.use(cors());

/* ===================================================
   STEP 1 — Validate ENV Vars
=================================================== */
const {
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE,
  PORT
} = process.env;

if (!PG_HOST || !PG_PORT || !PG_USER || !PG_PASSWORD || !PG_DATABASE) {
  console.error("❌ Missing PG_ variables. Fix your .env file!");
  process.exit(1);
}

/* ===================================================
   STEP 2 — Create DB if Not Exists
=================================================== */
const createDatabaseIfNotExists = async () => {
  const client = new Client({
    host: PG_HOST,
    port: Number(PG_PORT),
    user: PG_USER,
    password: PG_PASSWORD,
    database: "postgres",
  });

  try {
    await client.connect();

    const check = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [PG_DATABASE]
    );

    if (check.rows.length === 0) {
      await client.query(`CREATE DATABASE ${PG_DATABASE}`);
      console.log(`✅ Database '${PG_DATABASE}' created`);
    } else {
      console.log(`✅ Database '${PG_DATABASE}' already exists`);
    }

  } catch (err) {
    console.error("❌ Error creating database:", err);
  } finally {
    await client.end();
  }
};

await createDatabaseIfNotExists();

/* ===================================================
   STEP 3 — Connect to Pool
=================================================== */
const pool = new Pool({
  host: PG_HOST,
  port: Number(PG_PORT),
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE,
});

try {
  await pool.connect();
  console.log(`✅ Connected to PostgreSQL '${PG_DATABASE}'`);
} catch (err) {
  console.error("❌ DB Connection Error:", err);
  process.exit(1);
}

/* ===================================================
   STEP 4 — Create Bookings Table
=================================================== */
const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100),
        drink_name VARCHAR(100),
        price NUMERIC(10,2),
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'bookings' is ready");
  } catch (err) {
    console.error("❌ Table creation error:", err);
  }
};

await createTable();

/* ===================================================
   STEP 5 — Fix Column Name if Needed
=================================================== */
const fixColumnName = async () => {
  try {
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='bookings';
    `);

    const cols = result.rows.map(r => r.column_name);

    if (cols.includes("date") && !cols.includes("time")) {
      await pool.query(`ALTER TABLE bookings RENAME COLUMN date TO time`);
      console.log("🔧 Renamed column: date → time");
    }

  } catch (err) {
    console.error("❌ Column rename error:", err);
  }
};

await fixColumnName();

/* ===================================================
   STEP 6 — API ROUTES
=================================================== */

// GET all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bookings ORDER BY time DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

/*  
  🔥 FIXED POST ROUTE  
  Accepts BOTH types:
  → { customer_name, drink_name, price }
  → { customerName, drinkName, price }
*/
app.post("/api/bookings", async (req, res) => {
  try {
    const customerName = req.body.customer_name || req.body.customerName;
    const drinkName = req.body.drink_name || req.body.drinkName;
    const price = req.body.price;

    if (!customerName || !drinkName || price == null) {
      console.log("❌ Missing:", req.body);
      return res.status(400).json({ message: "Missing booking details" });
    }

    const result = await pool.query(
      "INSERT INTO bookings (customer_name, drink_name, price) VALUES ($1, $2, $3) RETURNING *",
      [customerName, drinkName, price]
    );

    console.log("📌 Booking inserted:", result.rows[0]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("❌ Create error:", err);
    res.status(500).json({ message: "Error creating booking" });
  }
});

/* ===================================================
   STEP 7 — Start Server
=================================================== */
const listenPort = Number(PORT || 5001);

app.listen(listenPort, () => {
  console.log(`🚀 Server running at http://localhost:${listenPort}`);
});
