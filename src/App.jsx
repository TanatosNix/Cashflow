import { useEffect, useMemo, useState } from "react";
import { loginWithGoogle, db, auth, logout } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";

function App() {
  const [user, setUser] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [savingMovimiento, setSavingMovimiento] = useState(false);
  const [appError, setAppError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("ingreso");

  const [editingId, setEditingId] = useState(null);
  const [editTipo, setEditTipo] = useState("ingreso");
  const [editMonto, setEditMonto] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});

  const [mesesSimulados, setMesesSimulados] = useState(0);
  const [valoresSimulados, setValoresSimulados] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [loadingDeudas, setLoadingDeudas] = useState(false);
  const [savingDeuda, setSavingDeuda] = useState(false);
  const [deudaTipo, setDeudaTipo] = useState("me_deben");
  const [deudaMonto, setDeudaMonto] = useState("");
  const [deudaDescripcion, setDeudaDescripcion] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mostrarDeudas, setMostrarDeudas] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuarioActual) => {
      setAppError("");
      try {
        if (usuarioActual) {
          setUser(usuarioActual);
          await cargarMovimientos(usuarioActual.uid);
          await cargarDeudas(usuarioActual.uid);
        } else {
          setUser(null);
          setMovimientos([]);
          setDeudas([]);
        }
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const safeDate = (value) => {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const cargarMovimientos = async (uid) => {
    setLoadingMovimientos(true);
    setAppError("");
    try {
      const ref = collection(db, "usuarios", uid, "movimientos");
      const q = query(ref, orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      const datos = snap.docs.map((movDoc) => ({ id: movDoc.id, ...movDoc.data() }));
      setMovimientos(datos);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      setAppError("No se pudieron cargar los movimientos. Intenta nuevamente.");
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const cargarDeudas = async (uid) => {
    setLoadingDeudas(true);
    try {
      const ref = collection(db, "usuarios", uid, "deudas");
      const q = query(ref, orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      const datos = snap.docs.map((deudaDoc) => ({ id: deudaDoc.id, ...deudaDoc.data() }));
      setDeudas(datos);
    } catch (error) {
      console.error("Error al cargar deudas:", error);
      setAppError("No se pudieron cargar las deudas.");
    } finally {
      setLoadingDeudas(false);
    }
  };

  const guardarMovimiento = async () => {
    const parsedMonto = Number(monto);
    if (!Number.isFinite(parsedMonto) || parsedMonto <= 0) {
      setAppError("Por favor ingresa una cantidad válida mayor a 0.");
      return;
    }

    if (!user?.uid) {
      setAppError("Usuario no autenticado.");
      return;
    }

    try {
      setSavingMovimiento(true);
      setAppError("");
      const nuevo = {
        tipo,
        monto: parsedMonto,
        descripcion: descripcion.trim(),
        fecha: new Date().toISOString(),
      };

      const ref = collection(db, "usuarios", user.uid, "movimientos");
      await addDoc(ref, nuevo);

      setMonto("");
      setDescripcion("");
      await cargarMovimientos(user.uid);
    } catch (error) {
      console.error("Error al guardar el movimiento:", error);
      setAppError("Hubo un error al guardar el movimiento. Intenta otra vez.");
    } finally {
      setSavingMovimiento(false);
    }
  };

  const iniciarEdicion = (mov) => {
    setEditingId(mov.id);
    setEditTipo(mov.tipo || "ingreso");
    setEditMonto(String(mov.monto ?? ""));
    setEditDescripcion(mov.descripcion || "");
    setAppError("");
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setEditTipo("ingreso");
    setEditMonto("");
    setEditDescripcion("");
  };

  const guardarEdicion = async (movId) => {
    const parsedMonto = Number(editMonto);
    if (!Number.isFinite(parsedMonto) || parsedMonto <= 0) {
      setAppError("El monto editado debe ser un número mayor a 0.");
      return;
    }

    if (!user?.uid) {
      setAppError("Usuario no autenticado.");
      return;
    }

    try {
      setSavingMovimiento(true);
      setAppError("");
      const movRef = doc(db, "usuarios", user.uid, "movimientos", movId);
      await updateDoc(movRef, {
        tipo: editTipo,
        monto: parsedMonto,
        descripcion: editDescripcion.trim(),
      });
      cancelarEdicion();
      await cargarMovimientos(user.uid);
    } catch (error) {
      console.error("Error al editar movimiento:", error);
      setAppError("No se pudo editar el movimiento.");
    } finally {
      setSavingMovimiento(false);
    }
  };

  const eliminarMovimiento = async (movId) => {
    if (!user?.uid) {
      setAppError("Usuario no autenticado.");
      return;
    }

    const ok = window.confirm("¿Seguro que quieres eliminar este movimiento?");
    if (!ok) return;

    try {
      setAppError("");
      const movRef = doc(db, "usuarios", user.uid, "movimientos", movId);
      await deleteDoc(movRef);
      if (editingId === movId) cancelarEdicion();
      await cargarMovimientos(user.uid);
    } catch (error) {
      console.error("Error al eliminar movimiento:", error);
      setAppError("No se pudo eliminar el movimiento.");
    }
  };

  const guardarDeuda = async () => {
    const parsedMonto = Number(deudaMonto);
    if (!Number.isFinite(parsedMonto) || parsedMonto <= 0) {
      setAppError("El monto de la deuda debe ser mayor a 0.");
      return;
    }
    if (!deudaDescripcion.trim()) {
      setAppError("La deuda debe tener una descripción.");
      return;
    }
    if (!user?.uid) {
      setAppError("Usuario no autenticado.");
      return;
    }

    try {
      setSavingDeuda(true);
      setAppError("");
      const ref = collection(db, "usuarios", user.uid, "deudas");
      await addDoc(ref, {
        tipo: deudaTipo,
        monto: parsedMonto,
        descripcion: deudaDescripcion.trim(),
        estado: "pendiente",
        aplicadaEnSaldo: false,
        fecha: new Date().toISOString(),
        fechaPago: null,
      });
      setDeudaMonto("");
      setDeudaDescripcion("");
      await cargarDeudas(user.uid);
    } catch (error) {
      console.error("Error al guardar deuda:", error);
      setAppError("No se pudo guardar la deuda.");
    } finally {
      setSavingDeuda(false);
    }
  };

  const marcarDeudaPagada = async (deuda) => {
    if (!user?.uid) {
      setAppError("Usuario no autenticado.");
      return;
    }
    if (deuda.estado === "pagada") return;

    try {
      setSavingDeuda(true);
      setAppError("");

      const deudaRef = doc(db, "usuarios", user.uid, "deudas", deuda.id);
      const pagoTipo = deuda.tipo === "me_deben" ? "ingreso" : "egreso";
      const pagoDescripcion = `Pago deuda: ${deuda.descripcion}`;
      const batch = writeBatch(db);

      if (!deuda.aplicadaEnSaldo) {
        const movimientosRef = collection(db, "usuarios", user.uid, "movimientos");
        const newMovimientoRef = doc(movimientosRef);
        batch.set(newMovimientoRef, {
          tipo: pagoTipo,
          monto: Number(deuda.monto) || 0,
          descripcion: pagoDescripcion,
          fecha: new Date().toISOString(),
        });
      }

      batch.update(deudaRef, {
        estado: "pagada",
        aplicadaEnSaldo: true,
        fechaPago: new Date().toISOString(),
      });

      await batch.commit();
      await Promise.all([cargarMovimientos(user.uid), cargarDeudas(user.uid)]);
    } catch (error) {
      console.error("Error al marcar deuda pagada:", error);
      setAppError("No se pudo actualizar la deuda.");
    } finally {
      setSavingDeuda(false);
    }
  };

  const descargarResumenPDF = async () => {
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const ingresos = movimientos
        .filter((m) => m.tipo === "ingreso")
        .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
      const egresos = movimientos
        .filter((m) => m.tipo === "egreso")
        .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

      const escapeHtml = (value) =>
        String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const rowsHtml = movimientos
        .map((mov) => {
          const date = safeDate(mov.fecha);
          const tipoTexto = mov.tipo === "ingreso" ? "Ingreso" : "Egreso";
          const tipoClass = mov.tipo === "ingreso" ? "tag-in" : "tag-out";
          const descripcion = mov.descripcion?.trim() ? mov.descripcion : "-";
          return `
            <tr>
              <td>${escapeHtml(date ? date.toLocaleDateString("es-ES") : "")}</td>
              <td><span class="tag ${tipoClass}">${escapeHtml(tipoTexto)}</span></td>
              <td>${escapeHtml(descripcion)}</td>
              <td class="amount">${escapeHtml(formatCurrency(mov.monto))}</td>
            </tr>
          `;
        })
        .join("");

      const today = format(new Date(), "dd/MM/yyyy");
      const downloadDate = format(new Date(), "yyyy-MM-dd");

      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-99999px";
      wrapper.style.top = "0";
      wrapper.style.width = "794px";
      wrapper.style.background = "#f4f7fb";
      wrapper.style.fontFamily =
        "'Segoe UI', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
      wrapper.innerHTML = `
        <style>
          .pdf-shell { color: #0f172a; padding: 32px 36px 40px; }
          .pdf-header {
            background: linear-gradient(135deg, #10b981 0%, #0ea5a4 100%);
            color: #fff;
            border-radius: 16px;
            padding: 24px 28px;
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.22);
          }
          .pdf-title { margin: 0; font-size: 36px; line-height: 1.15; letter-spacing: .3px; }
          .pdf-date { margin: 8px 0 0; font-size: 14px; opacity: .95; }
          .cards { margin-top: 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .card {
            background: #fff;
            border: 1px solid #dbe5ef;
            border-radius: 12px;
            padding: 12px 14px;
          }
          .card .k { font-size: 12px; color: #475569; margin: 0; }
          .card .v { font-size: 24px; font-weight: 700; margin: 4px 0 0; color: #0f172a; }
          .table-wrap {
            margin-top: 16px;
            background: #fff;
            border-radius: 12px;
            border: 1px solid #dbe5ef;
            overflow: hidden;
          }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          thead th {
            background: #0f172a;
            color: #fff;
            font-size: 13px;
            text-align: left;
            padding: 10px 12px;
          }
          tbody td {
            font-size: 13px;
            padding: 9px 12px;
            border-bottom: 1px solid #edf2f7;
            word-wrap: break-word;
          }
          tbody tr:nth-child(even) { background: #f8fafc; }
          .amount { font-weight: 700; }
          .tag {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 999px;
          }
          .tag-in { background: #dcfce7; color: #166534; }
          .tag-out { background: #fee2e2; color: #991b1b; }
          .empty { padding: 16px 12px; color: #64748b; font-style: italic; }
        </style>
        <div class="pdf-shell">
          <div class="pdf-header">
            <h1 class="pdf-title">CashFlow - Resumen Financiero</h1>
            <p class="pdf-date">Fecha de emisión: ${escapeHtml(today)}</p>
          </div>

          <div class="cards">
            <div class="card">
              <p class="k">Saldo actual</p>
              <p class="v">${escapeHtml(formatCurrency(saldoActual))}</p>
            </div>
            <div class="card">
              <p class="k">Ingresos acumulados</p>
              <p class="v">${escapeHtml(formatCurrency(ingresos))}</p>
            </div>
            <div class="card">
              <p class="k">Egresos acumulados</p>
              <p class="v">${escapeHtml(formatCurrency(egresos))}</p>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 18%;">Fecha</th>
                  <th style="width: 16%;">Tipo</th>
                  <th style="width: 46%;">Descripción</th>
                  <th style="width: 20%;">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${
                  rowsHtml ||
                  '<tr><td colspan="4" class="empty">No hay movimientos para mostrar.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.body.appendChild(wrapper);
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f4f7fb",
      });
      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/png");
      const docPdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pageWidth = docPdf.internal.pageSize.getWidth();
      const pageHeight = docPdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      docPdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        docPdf.addPage();
        docPdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
        heightLeft -= pageHeight;
      }

      docPdf.save(`cashflow-resumen-${downloadDate}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      setAppError("No se pudo generar el PDF. Instala dependencias y vuelve a intentar.");
    }
  };

  const saldoActual = useMemo(
    () =>
      movimientos.reduce(
        (acc, mov) => acc + (mov.tipo === "ingreso" ? Number(mov.monto) : -Number(mov.monto)),
        0
      ),
    [movimientos]
  );

  const generarCamposSimulador = (meses) => {
    const mesesLimitados = Math.max(0, Math.min(meses, 120));
    const nuevosCampos = Array.from({ length: mesesLimitados }, (_, i) => ({
      fecha: addMonths(new Date(), i),
      cantidad: "",
    }));
    setValoresSimulados(nuevosCampos);
  };

  const actualizarCantidadSimulada = (index, valor) => {
    const nuevosValores = [...valoresSimulados];
    nuevosValores[index].cantidad = valor;
    setValoresSimulados(nuevosValores);
  };

  const totalSimulado = useMemo(
    () => valoresSimulados.reduce((acc, val) => acc + (Number(val.cantidad) || 0), 0),
    [valoresSimulados]
  );

  const saldoProyectado = saldoActual + totalSimulado;

  const movimientosPorMes = useMemo(() => {
    const grouped = new Map();

    for (const mov of movimientos) {
      const date = safeDate(mov.fecha);
      const monthKey = date ? format(date, "yyyy-MM") : "sin-fecha";
      const label = date
        ? format(date, "MMMM yyyy", { locale: es }).replace(/^./, (c) => c.toUpperCase())
        : "Sin fecha";

      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, {
          monthKey,
          label,
          ingresos: 0,
          egresos: 0,
          items: [],
        });
      }

      const bucket = grouped.get(monthKey);
      const amount = Number(mov.monto) || 0;
      if (mov.tipo === "ingreso") bucket.ingresos += amount;
      else bucket.egresos += amount;
      bucket.items.push(mov);
    }

    return [...grouped.values()].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [movimientos]);

  const movimientosPorAnio = useMemo(() => {
    const grouped = new Map();
    for (const monthGroup of movimientosPorMes) {
      const yearKey = monthGroup.monthKey === "sin-fecha" ? "sin-anio" : monthGroup.monthKey.slice(0, 4);
      if (!grouped.has(yearKey)) {
        grouped.set(yearKey, {
          yearKey,
          label: yearKey === "sin-anio" ? "Sin año" : yearKey,
          months: [],
        });
      }
      grouped.get(yearKey).months.push(monthGroup);
    }
    return [...grouped.values()].sort((a, b) => b.yearKey.localeCompare(a.yearKey));
  }, [movimientosPorMes]);

  useEffect(() => {
    const now = new Date();
    const currentYear = format(now, "yyyy");
    const currentMonth = format(now, "yyyy-MM");

    setExpandedYears((prev) => {
      const next = { ...prev };
      for (const yearGroup of movimientosPorAnio) {
        if (next[yearGroup.yearKey] === undefined) {
          next[yearGroup.yearKey] = yearGroup.yearKey === currentYear;
        }
      }
      return next;
    });

    setExpandedMonths((prev) => {
      const next = { ...prev };
      for (const monthGroup of movimientosPorMes) {
        if (next[monthGroup.monthKey] === undefined) {
          next[monthGroup.monthKey] = monthGroup.monthKey === currentMonth;
        }
      }
      return next;
    });
  }, [movimientosPorAnio, movimientosPorMes]);

  const toggleYear = (yearKey) => {
    setExpandedYears((prev) => ({ ...prev, [yearKey]: !prev[yearKey] }));
  };

  const toggleMonth = (monthKey) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-zinc-900 text-white p-4">
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-zinc-900 text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bienvenido a CashFlow</h1>
          <button
            onClick={async () => {
              try {
                setAppError("");
                const userLogin = await loginWithGoogle();
                setUser(userLogin);
                await cargarMovimientos(userLogin.uid);
              } catch (error) {
                console.error("Error al iniciar sesión:", error);
                setAppError("No se pudo iniciar sesión. Revisa la configuración de Firebase.");
              }
            }}
            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
          >
            Iniciar sesión con Google
          </button>
          {appError && <p className="text-red-300 mt-3 text-sm">{appError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex justify-center items-center p-4">
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-12 h-12 rounded-xl border border-zinc-600 bg-zinc-800 flex flex-col justify-center items-center gap-1 hover:bg-zinc-700"
          aria-label="Abrir menú"
        >
          <span className="w-6 h-0.5 bg-white rounded" />
          <span className="w-6 h-0.5 bg-white rounded" />
          <span className="w-6 h-0.5 bg-white rounded" />
        </button>

        {menuOpen && (
          <div className="mt-2 w-64 rounded-xl border border-zinc-600 bg-zinc-800 p-3 shadow-xl space-y-2">
            <button
              onClick={() => {
                descargarResumenPDF();
                setMenuOpen(false);
              }}
              className="w-full bg-zinc-700 px-3 py-2 rounded hover:bg-zinc-600 text-sm text-left"
            >
              Descargar resumen (PDF)
            </button>
            <button
              onClick={() => {
                setMostrarDeudas((prev) => !prev);
                setMenuOpen(false);
              }}
              className="w-full bg-zinc-700 px-3 py-2 rounded hover:bg-zinc-600 text-sm text-left"
            >
              {mostrarDeudas ? "Ocultar deudas" : "Mostrar deudas"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl w-full max-w-3xl text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <img src="https://img.icons8.com/fluency/48/money.png" alt="logo" />
          <h1 className="text-3xl font-bold text-green-400">CashFlow</h1>
        </div>
        <p className="mt-1">Hola, {user.displayName}</p>
        <button
          onClick={async () => {
            await logout();
            setUser(null);
          }}
          className="bg-zinc-700 mt-2 px-4 py-1 rounded hover:bg-red-700"
        >
          Cerrar sesión
        </button>

        <h2 className="text-lg mt-4 text-green-300 font-semibold">
          Saldo actual: {formatCurrency(saldoActual)}
        </h2>
        {appError && <p className="text-red-300 mt-2 text-sm">{appError}</p>}

        <div className="mt-4 space-y-2 text-center">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full p-2 bg-zinc-700 rounded text-center"
          >
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Cantidad (EUR)"
            className="w-full p-2 bg-zinc-700 rounded text-center"
          />
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={tipo === "ingreso" ? "Descripción del ingreso (opcional)" : "Descripción del egreso"}
            className="w-full p-2 bg-zinc-700 rounded text-center"
          />
          <button
            onClick={guardarMovimiento}
            disabled={savingMovimiento}
            className="bg-green-500 w-full p-2 rounded hover:bg-green-600 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {savingMovimiento ? "Guardando..." : "Guardar"}
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold text-center mb-4">Historial por año y mes</h3>
          {loadingMovimientos && <p className="text-sm opacity-75 mb-3">Cargando movimientos...</p>}

          <div className="space-y-4 text-left">
            {movimientosPorAnio.map((yearGroup) => {
              const isYearOpen = !!expandedYears[yearGroup.yearKey];
              return (
                <div key={yearGroup.yearKey} className="border border-zinc-700 rounded-xl p-3">
                  <button
                    onClick={() => toggleYear(yearGroup.yearKey)}
                    className="w-full flex justify-between items-center font-bold text-green-300"
                  >
                    <span>{yearGroup.label}</span>
                    <span>{isYearOpen ? "Ocultar" : "Mostrar"}</span>
                  </button>

                  {isYearOpen && (
                    <div className="space-y-4 mt-3">
                      {yearGroup.months.map((grupo) => {
                        const isMonthOpen = !!expandedMonths[grupo.monthKey];
                        return (
                          <div key={grupo.monthKey} className="border border-zinc-700 rounded-xl p-3">
                            <button
                              onClick={() => toggleMonth(grupo.monthKey)}
                              className="w-full flex flex-wrap justify-between items-center gap-2 mb-2"
                            >
                              <p className="font-bold text-green-300">{grupo.label}</p>
                              <p className="text-sm text-zinc-300">{isMonthOpen ? "Ocultar" : "Mostrar"}</p>
                            </button>

                            {isMonthOpen && (
                              <div className="space-y-3">
                                {grupo.items.map((mov, idx) => {
                                  const isIngreso = mov.tipo === "ingreso";
                                  const bgColor = isIngreso ? "bg-green-900 border-green-500" : "bg-red-900 border-red-500";
                                  const textColor = isIngreso ? "text-green-300" : "text-red-300";
                                  const icon = isIngreso ? "+" : "-";
                                  const parsedDate = safeDate(mov.fecha);
                                  const fecha = parsedDate ? parsedDate.toLocaleDateString("es-ES") : "Fecha no disponible";
                                  const isEditing = editingId === mov.id;

                                  return (
                                    <div
                                      key={mov.id || `${mov.fecha}-${idx}`}
                                      className={`border rounded-xl px-4 py-3 ${bgColor} ${textColor} flex flex-col`}
                                    >
                                      {!isEditing ? (
                                        <>
                                          <div className="flex justify-between items-center font-semibold gap-3">
                                            <span className="text-lg">
                                              {icon} {formatCurrency(mov.monto)}
                                            </span>
                                            <span className="text-sm opacity-80">{fecha}</span>
                                          </div>
                                          {mov.descripcion && (
                                            <span className="text-sm italic mt-1 text-zinc-100">{mov.descripcion}</span>
                                          )}
                                          <div className="flex gap-2 mt-3">
                                            <button
                                              onClick={() => iniciarEdicion(mov)}
                                              className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm"
                                            >
                                              Editar
                                            </button>
                                            <button
                                              onClick={() => eliminarMovimiento(mov.id)}
                                              className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm"
                                            >
                                              Eliminar
                                            </button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="space-y-2">
                                          <select
                                            value={editTipo}
                                            onChange={(e) => setEditTipo(e.target.value)}
                                            className="w-full p-2 bg-zinc-700 rounded text-center"
                                          >
                                            <option value="ingreso">Ingreso</option>
                                            <option value="egreso">Egreso</option>
                                          </select>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editMonto}
                                            onChange={(e) => setEditMonto(e.target.value)}
                                            className="w-full p-2 bg-zinc-700 rounded text-center"
                                          />
                                          <input
                                            value={editDescripcion}
                                            onChange={(e) => setEditDescripcion(e.target.value)}
                                            placeholder="Descripción"
                                            className="w-full p-2 bg-zinc-700 rounded text-center"
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => guardarEdicion(mov.id)}
                                              disabled={savingMovimiento}
                                              className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm disabled:opacity-70"
                                            >
                                              Guardar cambios
                                            </button>
                                            <button
                                              onClick={cancelarEdicion}
                                              className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm"
                                            >
                                              Cancelar
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {mostrarDeudas && (
        <div className="mt-6 text-left">
          <h3 className="text-lg font-bold text-center mb-4">Control de deudas</h3>

          <div className="space-y-2">
            <select
              value={deudaTipo}
              onChange={(e) => setDeudaTipo(e.target.value)}
              className="w-full p-2 bg-zinc-700 rounded text-center"
            >
              <option value="me_deben">Me deben</option>
              <option value="debo">Debo</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={deudaMonto}
              onChange={(e) => setDeudaMonto(e.target.value)}
              placeholder="Monto de la deuda"
              className="w-full p-2 bg-zinc-700 rounded text-center"
            />
            <input
              value={deudaDescripcion}
              onChange={(e) => setDeudaDescripcion(e.target.value)}
              placeholder="Descripción de la deuda"
              className="w-full p-2 bg-zinc-700 rounded text-center"
            />
            <button
              onClick={guardarDeuda}
              disabled={savingDeuda}
              className="bg-cyan-600 w-full p-2 rounded hover:bg-cyan-500 disabled:opacity-70"
            >
              {savingDeuda ? "Guardando..." : "Registrar deuda"}
            </button>
          </div>

          {loadingDeudas && <p className="text-sm opacity-75 mt-3">Cargando deudas...</p>}
          <div className="space-y-2 mt-3">
            {deudas.map((deuda) => {
              const isPendiente = deuda.estado === "pendiente";
              const isMeDeben = deuda.tipo === "me_deben";
              return (
                <div
                  key={deuda.id}
                  className={`border rounded-lg p-3 ${
                    isPendiente ? "border-yellow-500 bg-zinc-900" : "border-zinc-600 bg-zinc-800"
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-semibold">
                      {isMeDeben ? "Me deben" : "Debo"}: {formatCurrency(deuda.monto)}
                    </p>
                    <p className="text-sm opacity-80">{isPendiente ? "Pendiente" : "Pagada"}</p>
                  </div>
                  <p className="text-sm mt-1">{deuda.descripcion}</p>
                  {isPendiente && (
                    <button
                      onClick={() => marcarDeudaPagada(deuda)}
                      disabled={savingDeuda}
                      className="mt-2 bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm disabled:opacity-70"
                    >
                      Marcar como pagada y aplicar al saldo
                    </button>
                  )}
                </div>
              );
            })}
            {!loadingDeudas && deudas.length === 0 && (
              <p className="text-sm text-zinc-400 text-center">No hay deudas registradas.</p>
            )}
          </div>
        </div>
        )}

        <div className="mt-6 text-center">
          <h3 className="text-lg font-bold">Simulador de ahorro</h3>
          <label className="block mt-2 mb-1 text-sm">Número de meses a simular:</label>
          <input
            type="number"
            value={mesesSimulados || ""}
            onChange={(e) => {
              const n = Math.max(0, Math.min(parseInt(e.target.value, 10) || 0, 120));
              setMesesSimulados(n);
              generarCamposSimulador(n);
            }}
            placeholder="Ej: 6"
            className="w-full p-2 bg-zinc-700 rounded text-center"
          />

          {valoresSimulados.map((item, idx) => (
            <div key={idx} className="mt-2">
              <p className="text-sm font-semibold">
                {format(item.fecha, "MMMM yyyy", { locale: es }).replace(/^./, (c) => c.toUpperCase())}
              </p>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Cantidad (EUR)"
                value={item.cantidad}
                onChange={(e) => actualizarCantidadSimulada(idx, e.target.value)}
                className="w-full p-2 bg-zinc-700 rounded text-center"
              />
            </div>
          ))}

          <p className="mt-4 font-semibold">Ahorro simulado: {formatCurrency(totalSimulado)}</p>
          <p className="mt-1 font-bold text-green-300">Saldo proyectado: {formatCurrency(saldoProyectado)}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
