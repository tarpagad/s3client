import { randomBytes, scrypt } from "node:crypto";
import { getDb } from "@/db";

const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 };

function scryptHash(password: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const salt = randomBytes(16).toString("hex");
		scrypt(
			password.normalize("NFKC"),
			salt,
			SCRYPT_CONFIG.dkLen,
			{ N: SCRYPT_CONFIG.N, r: SCRYPT_CONFIG.r, p: SCRYPT_CONFIG.p, maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2 },
			(err, key) => {
				if (err) reject(err);
				else resolve(`${salt}:${key.toString("hex")}`);
			},
		);
	});
}

interface SeedUser {
	name: string;
	email: string;
	password: string;
}

const SEED_USERS: SeedUser[] = [
	{
		name: "Admin",
		email: "admin@example.com",
		password: "admin123",
	},
];

function generateId(): string {
	return crypto.randomUUID();
}

function nowISO(): string {
	return new Date().toISOString();
}

async function seed() {
	const db = getDb();

	console.log("Seeding database...");

	const existingUsers = db
		.prepare("SELECT COUNT(*) as count FROM user")
		.get() as { count: number };

	if (existingUsers.count > 0) {
		console.log(
			`Database already has ${existingUsers.count} user(s). Skipping seed.`,
		);
		return;
	}

	for (const user of SEED_USERS) {
		const userId = generateId();
		const accountId = generateId();
		const now = nowISO();

		const passwordHash = await scryptHash(user.password);

		db.prepare(
			`INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
			 VALUES (?, ?, ?, 1, ?, ?)`,
		).run(userId, user.name, user.email, now, now);

		db.prepare(
			`INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
			 VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
		).run(accountId, user.email, userId, passwordHash, now, now);

		console.log(`  ✓ Created user: ${user.email}`);
	}

	console.log("Seed complete.");
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
