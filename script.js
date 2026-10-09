// Catálogo Global de Acciones (Fuera de la función)
const CATALOGO_ACCIONES = [
    {
        id: "rec1",
        nombre: "Reclamar 2km (Caminata)",
        costo: 0,
        baseRec: 300,
        icono: "fa-shoe-prints text-info",
        activoPorDefecto: true,
    },
    {
        id: "c1",
        nombre: "Combate 1★",
        costo: 250,
        baseRec: 120,
        icono: "fa-star text-warning",
        activoPorDefecto: true,
    },
    {
        id: "c3",
        nombre: "Combate 3★",
        costo: 400,
        baseRec: 120,
        icono: "fa-skull text-danger",
        activoPorDefecto: true,
    },
    {
        id: "mov1",
        nombre: "Desbloquear movimiento Dinamax",
        costo: 400,
        baseRec: 0,
        icono: "fa-unlock text-success",
        activoPorDefecto: true,
    },
    {
        id: "mov2",
        nombre: "Subir movimiento nivel 2",
        costo: 600,
        baseRec: 0,
        icono: "fa-dumbbell text-primary",
        activoPorDefecto: true,
    },
    {
        id: "mov3",
        nombre: "Subir movimiento nivel 3",
        costo: 800,
        baseRec: 0,
        icono: "fa-dumbbell text-primary",
        activoPorDefecto: true,
    },
    {
        id: "rec2",
        nombre: "Recolectar nodo sin pelear",
        costo: 0,
        baseRec: 120,
        icono: "fa-dove text-primary",
        activoPorDefecto: true,
    },
];

// Generar dinámicamente los Checkboxes al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("contenedorCheckboxes");
    if (!contenedor) return;

    contenedor.innerHTML = CATALOGO_ACCIONES.map(
        (acc) => `
        <div class="col-sm-6">
            <div class="form-check form-switch">
                <input 
                class="form-check-input chk-accion" 
                type="checkbox" 
                id="chk_${acc.id}" 
                value="${acc.id}" 
                ${acc.activoPorDefecto ? "checked" : ""}>
                <label class="form-check-label small" for="chk_${acc.id}">
                <i class="fa-solid ${acc.icono} me-1"></i>${acc.nombre}
                </label>
            </div>
        </div>
    `,
    ).join("");
});

function calcularArbol() {
    const saldoInicial = parseInt(document.getElementById("saldoIni").value) || 0;
    // Ahora "reclamosHoy" representa directamente los MP pendientes/faltantes del día
    const mpFaltantesIniciales = parseInt(document.getElementById("reclamosHoy").value) || 0;
    const minSaldo = parseInt(document.getElementById("minSaldo").value) || 900;
    const maxSaldo = parseInt(document.getElementById("maxSaldo").value) || 1190;
    const LIMITE_RECOLECCION = 1500;

    // Obtener únicamente los IDs de los checkboxes seleccionados
    const IDsSeleccionados = Array.from(
        document.querySelectorAll(".chk-accion:checked")
    ).map((chk) => chk.value);

    // Filtrar el catálogo global de acciones
    const ACCIONES = CATALOGO_ACCIONES.filter((acc) =>
        IDsSeleccionados.includes(acc.id)
    );

    let rutasEncontradas = [];

    // Algoritmo de exploración recursiva de árbol
    function explorar(saldoActual, cupoDiarioFaltante, historial) {
        // Si alcanzamos el rango objetivo en el inventario
        if (
            historial.length > 0 &&
            saldoActual >= minSaldo &&
            saldoActual <= maxSaldo
        ) {
            rutasEncontradas.push({
                saldoFinal: saldoActual,
                cupoRestanteFinal: cupoDiarioFaltante,
                pasos: [...historial],
            });
            return;
        }

        // if (historial.length >= 4) return;

        for (let acc of ACCIONES) {
            let recEfectiva = 0;

            // Si la acción otorga partículas:
            // Solo requiere que al INICIAR el paso tengas < 1500 MP y te queden MP por reclamar (> 0).
            if (acc.baseRec > 0) {
                if (saldoActual < LIMITE_RECOLECCION && cupoDiarioFaltante > 0) {
                    recEfectiva = acc.baseRec; // Permite el desborde completo (120 o 300)
                }
            }

            // Si es una acción para recolectar (nodo o caminata) pero dio 0 MP, se omite
            if ((acc.id === "rec1" || acc.id === "rec2") && recEfectiva === 0) {
                continue;
            }

            let saldoAntesPago = saldoActual + recEfectiva;

            if (saldoAntesPago >= acc.costo) {
                let saldoFinal = saldoAntesPago - acc.costo;

                // Si la acción recolectó MP, el cupo pendiente se reduce a 0 o menos para marcar que se agotó el límite diario
                let nuevoCupoFaltante = acc.baseRec > 0
                    ? Math.max(0, cupoDiarioFaltante - acc.baseRec)
                    : cupoDiarioFaltante;

                explorar(saldoFinal, nuevoCupoFaltante, [
                    ...historial,
                    {
                        accionId: acc.id,
                        nombre: acc.nombre,
                        icono: acc.icono,
                        saldoInicial: saldoActual,
                        recolectado: recEfectiva,
                        costo: acc.costo,
                        saldoFinal: saldoFinal,
                    },
                ]);
            }
        }

    }

    explorar(saldoInicial, mpFaltantesIniciales, []);

    // Ordenar resultados:
    // 1. De MAYOR a MENOR saldo final (b.saldoFinal - a.saldoFinal)
    // 2. Prioridad si incluye caminata > 0
    // 3. Menor cantidad de pasos
    rutasEncontradas.sort((a, b) => {
        if (b.saldoFinal !== a.saldoFinal) {
            return b.saldoFinal - a.saldoFinal;
        }

        let camA = a.pasos.some((p) => p.accionId === "rec1" && p.recolectado > 0) ? 1 : 0;
        let camB = b.pasos.some((p) => p.accionId === "rec1" && p.recolectado > 0) ? 1 : 0;
        if (camA !== camB) return camB - camA;

        return a.pasos.length - b.pasos.length;
    });

    // Renderizado de Resultados en la interfaz
    const container = document.getElementById("resultadosContainer");
    container.innerHTML = "";

    if (rutasEncontradas.length === 0) {
        container.innerHTML = `
        <div class="alert alert-warning text-center">
            <i class="fa-solid fa-triangle-exclamation me-2"></i>No se encontraron rutas que terminen exactamente en el rango de <strong>${minSaldo} a ${maxSaldo} MP</strong> con las acciones seleccionadas.
        </div>`;
        return;
    }

    let html = `<h5 class="fw-bold mb-3"><i class="fa-solid fa-route text-success me-2"></i>${rutasEncontradas.length} Ruta(s) Encontrada(s) [${minSaldo} - ${maxSaldo} MP]:</h5>`;

    rutasEncontradas.forEach((ruta, idx) => {
        const tieneCaminata = ruta.pasos.some(
            (p) => p.accionId === "rec1" && p.recolectado > 0
        );

        // Puntos totales sumados al cupo diario durante la ruta
        const mpReclamadosEnRuta = mpFaltantesIniciales - Math.max(0, ruta.cupoRestanteFinal);
        const mpFaltantesAlFinal = Math.max(0, ruta.cupoRestanteFinal);

        html += `
        <div class="card card-custom shadow-sm mb-3 bg-white">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
            <span class="fw-bold text-dark">Opción ${idx + 1} (${ruta.pasos.length} pasos)</span>
            <div>
            ${tieneCaminata ? '<span class="badge bg-info text-dark me-1"><i class="fas fa-shoe-prints me-1"></i>Incluye 2km</span>' : ""}
            <span class="badge bg-success">Saldo Final: ${ruta.saldoFinal} MP</span>
            </div>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
            <table class="table table-sm table-hover mb-0 text-center align-middle" style="font-size: 0.85rem;">
                <thead class="table-light">
                <tr>
                    <th>Acción</th>
                    <th>Inicio</th>
                    <th>Recolección</th>
                    <th>Costo</th>
                    <th>Final</th>
                </tr>
                </thead>
                <tbody>`;

        ruta.pasos.forEach((p) => {
            html += `
            <tr>
            <td class="text-start ps-3"><i class="fa-solid ${p.icono} me-1"></i>${p.nombre}</td>
            <td>${p.saldoInicial} MP</td>
            <td class="${p.recolectado > 0 ? "text-success fw-bold" : "text-muted"}">+${p.recolectado} MP</td>
            <td class="${p.costo > 0 ? "text-danger" : "text-muted"}">-${p.costo} MP</td>
            <td class="fw-bold">${p.saldoFinal} MP</td>
            </tr>`;
        });

        html += `
                </tbody>
            </table>
            </div>
        </div>
        <div class="card-footer bg-light small text-muted text-start">
            En esta ruta reclamaste <strong>${mpReclamadosEnRuta} MP</strong> del cupo diario. 
            Te faltarían <strong>${mpFaltantesAlFinal} MP</strong> por reclamar de los <strong>800 diarios</strong>.
        </div>
        </div>`;
    });

    container.innerHTML = html;
}
