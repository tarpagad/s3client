import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_URL || "./s3client.db";

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
	if (!dbInstance) {
		dbInstance = new Database(DB_PATH);
		dbInstance.pragma("journal_mode = WAL");
		initializeTables(dbInstance);
	}
	return dbInstance;
}

function initializeTables(db: Database.Database) {
	db.exec(`CREATE TABLE IF NOT EXISTS user (
		id TEXT NOT NULL PRIMARY KEY,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		emailVerified INTEGER NOT NULL DEFAULT 0,
		image TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL,
		role TEXT,
		banned INTEGER,
		banReason TEXT,
		banExpires TEXT
	)`);

	db.exec(`CREATE TABLE IF NOT EXISTS session (
		id TEXT NOT NULL PRIMARY KEY,
		expiresAt TEXT NOT NULL,
		token TEXT NOT NULL UNIQUE,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL,
		ipAddress TEXT,
		userAgent TEXT,
		userId TEXT NOT NULL REFERENCES user(id),
		impersonatedBy TEXT
	)`);

	db.exec(`CREATE TABLE IF NOT EXISTS account (
		id TEXT NOT NULL PRIMARY KEY,
		accountId TEXT NOT NULL,
		providerId TEXT NOT NULL,
		userId TEXT NOT NULL REFERENCES user(id),
		accessToken TEXT,
		refreshToken TEXT,
		idToken TEXT,
		accessTokenExpiresAt TEXT,
		refreshTokenExpiresAt TEXT,
		scope TEXT,
		password TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`);

	db.exec(`CREATE TABLE IF NOT EXISTS verification (
		id TEXT NOT NULL PRIMARY KEY,
		identifier TEXT NOT NULL,
		value TEXT NOT NULL,
		expiresAt TEXT NOT NULL,
		createdAt TEXT,
		updatedAt TEXT
	)`);

	db.exec(`CREATE TABLE IF NOT EXISTS bucket_connection (
		id TEXT NOT NULL PRIMARY KEY,
		userId TEXT NOT NULL REFERENCES user(id),
		name TEXT NOT NULL,
		type TEXT NOT NULL CHECK(type IN ('s3', 'r2')),
		accessKeyId TEXT NOT NULL,
		secretAccessKey TEXT NOT NULL,
		region TEXT NOT NULL DEFAULT 'us-east-1',
		endpoint TEXT,
		bucket TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`);
}
