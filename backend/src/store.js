const fs = require("fs");
const path = require("path");
const { TABLES, schemaSql } = require("./schema");
const { buildSeed } = require("./seed");

const DATA_DIR = path.join(__dirname, "..", "data");
const JSON_PATH = path.join(DATA_DIR, "store.json");
const SCHEMA_PATH = path.join(__dirname, "..", "schema.sql");

const EMPTY = () =>
  Object.fromEntries(Object.keys(TABLES).map((name) => [name, []]));

function blankRow(table) {
  const row = {};
  for (const [col, type] of TABLES[table]) {
    if (type === "int" || type === "tiny" || type === "decimal") row[col] = 0;
    else if (type === "json") row[col] = {};
    else row[col] = "";
  }
  return row;
}

function toSql(type, value) {
  if (value === undefined || value === null || value === "") {
    if (type === "int" || type === "tiny" || type === "decimal") return value === 0 ? 0 : null;
    if (type === "json") return "{}";
    return value === "" ? "" : null;
  }
  if (type === "json") return typeof value === "string" ? value : JSON.stringify(value);
  if (type === "tiny") return value ? 1 : 0;
  if (type === "int") return Number(value) || 0;
  if (type === "decimal") return Number(value) || 0;
  return String(value);
}

function fromSql(type, value) {
  if (value === undefined || value === null) {
    if (type === "json") return {};
    if (type === "int" || type === "tiny" || type === "decimal") return 0;
    return "";
  }
  if (type === "json") {
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (type === "tiny") return Number(value) ? 1 : 0;
  if (type === "int") return Number(value) || 0;
  if (type === "decimal") return Number(value) || 0;
  if (typeof value === "bigint") return Number(value);
  return value;
}

function normalizeRow(table, row) {
  const out = blankRow(table);
  for (const [col, type] of TABLES[table]) {
    if (row[col] !== undefined && row[col] !== null) out[col] = fromSql(type, row[col]);
  }
  out.id = Number(row.id) || out.id;
  return out;
}

class DualStore {
  constructor() {
    this.data = null;
    this.pool = null;
    this.mysqlUp = false;
    this.lastError = "";
    this.lastTry = 0;
  }

  status() {
    return {
      mysql: this.mysqlUp,
      source: this.mysqlUp ? "mysql" : "json",
      jsonPath: JSON_PATH,
      lastError: this.mysqlUp ? "" : this.lastError,
    };
  }

  readFile() {
    if (!fs.existsSync(JSON_PATH)) return null;
    return JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  }

  writeFile(data) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const ordered = { meta: data.meta || { pending_tables: [] } };
    for (const name of Object.keys(TABLES)) ordered[name] = data[name] || [];
    fs.writeFileSync(JSON_PATH, JSON.stringify(ordered, null, 2));
    this.data = ordered;
  }

  async init() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SCHEMA_PATH, schemaSql());
    const existing = this.readFile();
    if (!existing) {
      const seed = buildSeed();
      this.writeFile({ meta: { pending_tables: [] }, ...seed });
    } else {
      this.data = existing;
      this.data.meta = this.data.meta || { pending_tables: [] };
      for (const name of Object.keys(TABLES)) {
        this.data[name] = (existing[name] || []).map((row) => normalizeRow(name, row));
      }
    }
    await this.tryConnect();
  }

  async tryConnect() {
    this.lastTry = Date.now();
    const host = process.env.MYSQL_HOST || "127.0.0.1";
    const user = process.env.MYSQL_USER || "root";
    const password = process.env.MYSQL_PASSWORD || "";
    const database = process.env.MYSQL_DATABASE || "kidlo";
    const port = Number(process.env.MYSQL_PORT || 3306);
    if (process.env.MYSQL_DISABLED === "1") {
      this.mysqlUp = false;
      this.lastError = "MySQL disabled by MYSQL_DISABLED=1";
      return false;
    }
    let mysql;
    try {
      mysql = require("mysql2/promise");
    } catch (err) {
      this.mysqlUp = false;
      this.lastError = "mysql2 is not installed";
      return false;
    }
    try {
      const bootstrap = await mysql.createConnection({
        host,
        port,
        user,
        password,
        connectTimeout: 2500,
      });
      await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await bootstrap.end();
      if (this.pool) {
        try { await this.pool.end(); } catch { /* ignore */ }
      }
      this.pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 8,
        connectTimeout: 2500,
      });
      await this.pool.query("SELECT 1");
      await this.ensureTables();
      await this.reconcile();
      this.mysqlUp = true;
      this.lastError = "";
      return true;
    } catch (err) {
      this.mysqlUp = false;
      this.lastError = err.message;
      this.pool = null;
      return false;
    }
  }

  async ensureMysql() {
    if (this.mysqlUp && this.pool) {
      try {
        await this.pool.query("SELECT 1");
        return true;
      } catch (err) {
        this.mysqlUp = false;
        this.lastError = err.message;
      }
    }
    if (Date.now() - this.lastTry < 8000) return false;
    return this.tryConnect();
  }

  async ensureTables() {
    for (const statement of schemaSql().split(";").map((s) => s.trim()).filter((s) => s.startsWith("CREATE"))) {
      await this.pool.query(statement);
    }
  }

  async reconcile() {
    const pending = new Set(this.data.meta.pending_tables || []);
    const [countRows] = await this.pool.query("SELECT COUNT(*) AS c FROM products");
    const mysqlEmpty = Number(countRows[0].c) === 0;
    if (mysqlEmpty) {
      for (const name of Object.keys(TABLES)) await this.pushTable(name);
    } else if (pending.size) {
      for (const name of pending) await this.pushTable(name);
    }
    if (!mysqlEmpty || pending.size) {
      for (const name of Object.keys(TABLES)) this.data[name] = await this.pullTable(name);
    } else {
      for (const name of Object.keys(TABLES)) this.data[name] = await this.pullTable(name);
    }
    this.data.meta.pending_tables = [];
    this.writeFile(this.data);
  }

  async pushTable(name) {
    await this.pool.query(`DELETE FROM \`${name}\``);
    for (const row of this.data[name] || []) {
      await this.replaceRow(name, normalizeRow(name, row));
    }
  }

  async pullTable(name) {
    const [rows] = await this.pool.query(`SELECT * FROM \`${name}\` ORDER BY id ASC`);
    return rows.map((row) => normalizeRow(name, row));
  }

  async replaceRow(name, row) {
    const cols = TABLES[name].map(([col]) => col);
    const sql = `REPLACE INTO \`${name}\` (${cols.map((c) => `\`${c}\``).join(",")}) VALUES (${cols.map(() => "?").join(",")})`;
    const values = TABLES[name].map(([col, type]) => toSql(type, row[col]));
    await this.pool.query(sql, values);
  }

  all(name) {
    if (!TABLES[name]) throw new Error(`Unknown table ${name}`);
    return (this.data[name] || []).map((row) => normalizeRow(name, row));
  }

  get(name, id) {
    return this.all(name).find((row) => Number(row.id) === Number(id)) || null;
  }

  async insert(name, input) {
    const rows = this.all(name);
    const id = input.id ? Number(input.id) : rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
    const now = new Date().toISOString();
    const row = normalizeRow(name, { ...input, id, created_at: input.created_at || now, updated_at: now });
    this.data[name] = rows.filter((item) => Number(item.id) !== id).concat(row);
    await this.persist(name);
    return row;
  }

  async update(name, id, patch) {
    const rows = this.all(name);
    const current = rows.find((row) => Number(row.id) === Number(id));
    if (!current) return null;
    const row = normalizeRow(name, { ...current, ...patch, id: Number(id), updated_at: new Date().toISOString() });
    this.data[name] = rows.map((item) => (Number(item.id) === Number(id) ? row : item));
    await this.persist(name);
    return row;
  }

  async remove(name, id) {
    const before = this.all(name).length;
    this.data[name] = this.all(name).filter((row) => Number(row.id) !== Number(id));
    if (this.data[name].length === before) return false;
    await this.persist(name);
    return true;
  }

  async persist(name) {
    const up = await this.ensureMysql();
    if (!up) {
      const pending = new Set(this.data.meta.pending_tables || []);
      pending.add(name);
      this.data.meta.pending_tables = [...pending];
      this.writeFile(this.data);
      return;
    }
    try {
      const rowIds = new Set(this.data[name].map((row) => Number(row.id)));
      const existing = await this.pullTable(name);
      for (const old of existing) {
        if (!rowIds.has(Number(old.id))) await this.pool.query(`DELETE FROM \`${name}\` WHERE id = ?`, [old.id]);
      }
      for (const row of this.data[name]) await this.replaceRow(name, row);
      const pending = new Set(this.data.meta.pending_tables || []);
      pending.delete(name);
      this.data.meta.pending_tables = [...pending];
      this.writeFile(this.data);
    } catch (err) {
      this.mysqlUp = false;
      this.lastError = err.message;
      const pending = new Set(this.data.meta.pending_tables || []);
      pending.add(name);
      this.data.meta.pending_tables = [...pending];
      this.writeFile(this.data);
    }
  }
}

module.exports = { DualStore, blankRow, normalizeRow };
