import fs from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const rules = await fs.readFile("firestore.rules", "utf8");
const testEnv = await initializeTestEnvironment({
  projectId: "cashflow-rules-test",
  firestore: { rules },
});

let failures = 0;

const validMovimiento = {
  tipo: "ingreso",
  monto: 100,
  descripcion: "Test ingreso",
  fecha: "2026-03-07T10:00:00.000Z",
};

const validDeuda = {
  tipo: "me_deben",
  monto: 200,
  descripcion: "Deuda prueba",
  estado: "pendiente",
  aplicadaEnSaldo: false,
  fecha: "2026-03-07T10:00:00.000Z",
  fechaPago: null,
};

async function runTest(name, fn) {
  try {
    await testEnv.clearFirestore();
    await fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL: ${name}`);
    console.error(error);
  }
}

await runTest("No autenticado no puede leer movimientos", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(unauthDb, "usuarios/alice/movimientos/m1")));
});

await runTest("Owner puede crear movimiento válido", async () => {
  const aliceDb = testEnv.authenticatedContext("alice").firestore();
  await assertSucceeds(setDoc(doc(aliceDb, "usuarios/alice/movimientos/m1"), validMovimiento));
});

await runTest("Otro usuario no puede leer movimientos de alice", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const adminDb = ctx.firestore();
    await setDoc(doc(adminDb, "usuarios/alice/movimientos/m1"), validMovimiento);
  });

  const bobDb = testEnv.authenticatedContext("bob").firestore();
  await assertFails(getDoc(doc(bobDb, "usuarios/alice/movimientos/m1")));
});

await runTest("Owner no puede crear movimiento con tipo inválido", async () => {
  const aliceDb = testEnv.authenticatedContext("alice").firestore();
  await assertFails(
    setDoc(doc(aliceDb, "usuarios/alice/movimientos/m1"), {
      ...validMovimiento,
      tipo: "otro",
    })
  );
});

await runTest("Owner puede crear y actualizar deuda válida", async () => {
  const aliceDb = testEnv.authenticatedContext("alice").firestore();
  const deudaRef = doc(aliceDb, "usuarios/alice/deudas/d1");
  await assertSucceeds(setDoc(deudaRef, validDeuda));
  await assertSucceeds(
    updateDoc(deudaRef, {
      estado: "pagada",
      aplicadaEnSaldo: true,
      fechaPago: "2026-03-08T10:00:00.000Z",
    })
  );
});

await runTest("No permite deudas con estado inválido", async () => {
  const aliceDb = testEnv.authenticatedContext("alice").firestore();
  await assertFails(
    setDoc(doc(aliceDb, "usuarios/alice/deudas/d1"), {
      ...validDeuda,
      estado: "cerrada",
    })
  );
});

await testEnv.cleanup();

if (failures > 0) {
  console.error(`\n${failures} test(s) fallaron.`);
  process.exit(1);
}

console.log("\nTodos los tests de reglas pasaron.");
