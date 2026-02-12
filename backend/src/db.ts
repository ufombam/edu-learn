import { Pool } from 'pg';


export const pool = new Pool({
  host: process.env.PROJ_DB_HOST,
  port: parseInt(process.env.PROJ_DB_PORT || '5432'),
  user: process.env.PROJ_DB_USER,
  password: process.env.PROJ_DB_PASSWORD,
  database: process.env.PROJ_DB_NAME,
});

pool.on("connect", () => {
  console.log("New DB client connected");
});
