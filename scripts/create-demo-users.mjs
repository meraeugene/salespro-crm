import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const seedFilePath = path.join(projectRoot, "supabase", "seed-users.json");
const envFileCandidates = [".env.local", ".env"];
const validRoles = new Set(["admin", "sales_manager", "sales_representative"]);
const authLogQuery = `select
  cast(postgres_logs.timestamp as datetime) as timestamp,
  event_message,
  parsed.error_severity,
  parsed.user_name,
  parsed.query,
  parsed.detail,
  parsed.hint,
  parsed.sql_state_code,
  parsed.backend_type
from
  postgres_logs
  cross join unnest(metadata) as metadata
  cross join unnest(metadata.parsed) as parsed
where
  regexp_contains(parsed.error_severity, 'ERROR|FATAL|PANIC')
  and regexp_contains(parsed.user_name, 'supabase_auth_admin')
order by timestamp desc
limit 100;`;

function parseEnvLines(content) {
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

async function loadEnvFiles() {
  for (const fileName of envFileCandidates) {
    const filePath = path.join(projectRoot, fileName);

    try {
      const content = await fs.readFile(filePath, "utf8");
      parseEnvLines(content);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
      throw error;
    }
  }
}

function getEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function isAuthAdminUnexpectedFailure(error) {
  return (
    error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 500 &&
    "code" in error &&
    error.code === "unexpected_failure"
  );
}

function wrapAuthAdminError(error, action) {
  if (!isAuthAdminUnexpectedFailure(error)) {
    return error;
  }

  return new Error(
    [
      `Supabase Auth failed while trying to ${action}.`,
      "This usually means the project's Auth/database state is broken, not the seed script.",
      "Common causes: a bad trigger on auth.users, a broken constraint, or damaged permissions on auth-managed tables.",
      "Open Supabase Dashboard > Logs, then run this Log Explorer query:",
      authLogQuery,
    ].join("\n\n"),
    { cause: error },
  );
}

function normalizeSeedUser(entry, index) {
  const email = String(entry.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(entry.password ?? "");
  const fullName = String(entry.full_name ?? "").trim();
  const role = String(entry.role ?? "").trim();
  const managerEmail = entry.manager_email
    ? String(entry.manager_email).trim().toLowerCase()
    : null;

  if (!email) {
    throw new Error(`User at index ${index} is missing email.`);
  }
  if (!password) {
    throw new Error(`User ${email} is missing password.`);
  }
  if (!fullName) {
    throw new Error(`User ${email} is missing full_name.`);
  }
  if (!validRoles.has(role)) {
    throw new Error(
      `User ${email} has invalid role "${role}". Expected admin, sales_manager, or sales_representative.`,
    );
  }

  return {
    email,
    password,
    fullName,
    role,
    managerEmail,
  };
}

async function readSeedUsers() {
  const raw = await fs.readFile(seedFilePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("supabase/seed-users.json must contain an array.");
  }

  const users = parsed.map(normalizeSeedUser);
  const emails = new Set(users.map((user) => user.email));

  for (const user of users) {
    if (user.managerEmail && !emails.has(user.managerEmail)) {
      throw new Error(
        `User ${user.email} references missing manager_email ${user.managerEmail}.`,
      );
    }
  }

  return users;
}

async function findUserByEmail(admin, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw wrapAuthAdminError(error, "list Auth users");
    }

    const users = data?.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === email);
    if (match) {
      return match;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function upsertUser(admin, userSeed) {
  const existing = await findUserByEmail(admin, userSeed.email);

  if (!existing) {
    const { data, error } = await admin.auth.admin.createUser({
      email: userSeed.email,
      password: userSeed.password,
      email_confirm: true,
      user_metadata: {
        full_name: userSeed.fullName,
        role: userSeed.role,
      },
    });

    if (error || !data.user) {
      throw wrapAuthAdminError(
        error ?? new Error(`Unable to create ${userSeed.email}`),
        `create Auth user ${userSeed.email}`,
      );
    }

    return data.user;
  }

  const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
    password: userSeed.password,
    email_confirm: true,
    user_metadata: {
      full_name: userSeed.fullName,
      role: userSeed.role,
    },
  });

  if (error || !data.user) {
    throw wrapAuthAdminError(
      error ?? new Error(`Unable to update ${userSeed.email}`),
      `update Auth user ${userSeed.email}`,
    );
  }

  return data.user;
}

async function upsertProfile(admin, authUser, userSeed, usersByEmail) {
  const managerId = userSeed.managerEmail
    ? usersByEmail.get(userSeed.managerEmail)?.id ?? null
    : null;

  const { error } = await admin.from("profiles").upsert(
    {
      id: authUser.id,
      full_name: userSeed.fullName,
      email: userSeed.email,
      avatar_url: null,
      role: userSeed.role,
      manager_id: managerId,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function main() {
  await loadEnvFiles();

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const userSeeds = await readSeedUsers();

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const usersByEmail = new Map();

  for (const userSeed of userSeeds) {
    const authUser = await upsertUser(admin, userSeed);
    usersByEmail.set(userSeed.email, authUser);
  }

  for (const userSeed of userSeeds) {
    const authUser = usersByEmail.get(userSeed.email);
    await upsertProfile(admin, authUser, userSeed, usersByEmail);
    console.log(`Seeded ${userSeed.email} (${userSeed.role})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
