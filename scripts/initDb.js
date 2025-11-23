import fs from "fs";
import { pool } from "../utils/dbConnection.js";

async function init_db() {
  const fileSchema = fs.readFileSync("./schema.sql", "utf-8");

  await pool.query(fileSchema);
  console.log("🗄️🔌DB connection successfull!");
  process.exit(0);
}

init_db();
