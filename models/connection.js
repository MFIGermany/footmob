import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const DEFAULT_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: Number(process.env.DB_PORT || 3306),
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

const connectionConfig = process.env.DATABASE_URL ?? DEFAULT_CONFIG

export const pool = mysql.createPool(connectionConfig)