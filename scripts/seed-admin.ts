import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const required = ["DATABASE_MIGRATOR_URL", "ADMIN_NOMBRE", "ADMIN_DNI", "ADMIN_PASSWORD"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌  Faltan variables de entorno: ${missing.join(", ")}`);
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_MIGRATOR_URL });

async function run() {
  const nombre = process.env.ADMIN_NOMBRE!;
  const dni    = process.env.ADMIN_DNI!.toUpperCase().trim();
  const email  = process.env.ADMIN_EMAIL ?? null;
  const password = process.env.ADMIN_PASSWORD!;

  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(
      "SELECT id FROM usuarios WHERE identificador_legal = $1",
      [dni]
    );

    if (rowCount && rowCount > 0) {
      console.log(`ℹ️  Ya existe un usuario con identificador ${dni}. No se creó ninguno nuevo.`);
      return;
    }

    // cost 12 — igual que el resto de logins en la app
    const hash = await bcrypt.hash(password, 12);

    await client.query(
      `INSERT INTO usuarios
         (nombre, identificador_legal, email, password_hash, rol, debe_cambiar_password)
       VALUES ($1, $2, $3, $4, 'admin', false)`,
      [nombre, dni, email, hash]
    );

    console.log(`✅  Usuario admin creado: ${dni} (${nombre})`);
    if (email) console.log(`    Email: ${email}`);
    console.log(`    Contraseña: la que pusiste en ADMIN_PASSWORD.`);
    console.log(`    Recuerda cambiarla después del primer acceso.`);
  } catch (err) {
    console.error("❌  Error al crear el admin:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
