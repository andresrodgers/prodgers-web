import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

const url = process.env.DATABASE_MIGRATOR_URL;
if (!url) {
  console.error("❌  Falta DATABASE_MIGRATOR_URL en las variables de entorno.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

async function run() {
  const client = await pool.connect();

  try {
    // Tabla de tracking — creada por el migrador si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL      PRIMARY KEY,
        filename    TEXT        NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Migraciones ya registradas
    const { rows } = await client.query<{ filename: string }>(
      "SELECT filename FROM _migrations ORDER BY filename"
    );
    const applied = new Set(rows.map((r) => r.filename));

    // Archivos .sql en orden lexicográfico (001_, 002_, …)
    const migrationsDir = path.join(process.cwd(), "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No hay archivos de migración en migrations/.");
      return;
    }

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  ↩  ${file} ya aplicada, saltando.`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      console.log(`→ Aplicando ${file}...`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`✓ ${file} aplicada.`);
        count++;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    if (count === 0) {
      console.log("✅  Base de datos al día. Sin migraciones nuevas.");
    } else {
      console.log(`\n✅  ${count} migración(es) aplicada(s).`);
    }
  } catch (err) {
    console.error("\n❌  Error al ejecutar migraciones:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
