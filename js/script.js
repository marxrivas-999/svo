/* Sistema Online de Ventas - Sprint 1: Catálogo de productos
 * Los datos se guardan en localStorage (sin servidor) para poder
 * demostrar el incremento. Más adelante se puede cambiar por la BD (bd/svo.sql).
 */

const CLAVE = "svo_productos";
let productos = [];
let editandoCodigo = null; // null = modo registro; con valor = modo modificación

/* ---------- Almacenamiento ---------- */
function cargarProductos() {
    try {
        productos = JSON.parse(localStorage.getItem(CLAVE)) || [];
    } catch (e) {
        productos = [];
    }
}

function guardarProductos() {
    localStorage.setItem(CLAVE, JSON.stringify(productos));
}

/* ---------- T01_05 / T03_01: validaciones ---------- */
// Devuelve un objeto { campo: "mensaje" } con los errores; vacío = datos válidos.
function validarProducto(datos, codigoOriginal) {
    const errores = {};

    if (!datos.codigo) {
        errores.codigo = "El código es obligatorio.";
    } else if (productos.some(p => p.codigo === datos.codigo && p.codigo !== codigoOriginal)) {
        errores.codigo = "Ya existe un producto con ese código.";
    }

    if (!datos.nombre) {
        errores.nombre = "El nombre es obligatorio.";
    }

    const precio = Number(datos.precio);
    if (datos.precio === "" || isNaN(precio) || precio <= 0) {
        errores.precio = "El precio debe ser un número mayor a 0.";
    }

    const existencias = Number(datos.existencias);
    if (datos.existencias === "" || !Number.isInteger(existencias) || existencias < 0) {
        errores.existencias = "Las existencias deben ser un entero mayor o igual a 0.";
    }

    return errores;
}

/* ---------- Utilidades de interfaz ---------- */
const $ = id => document.getElementById(id);
const CAMPOS = ["codigo", "nombre", "descripcion", "categoria", "precio", "existencias"];

function leerFormulario() {
    const datos = {};
    CAMPOS.forEach(c => (datos[c] = $(c).value.trim()));
    return datos;
}

function mostrarMensaje(texto, tipo) {
    const m = $("mensaje");
    m.textContent = texto;
    m.className = tipo; // "ok" | "err" | ""
}

function marcarErrores(errores) {
    CAMPOS.forEach(c => $(c).classList.toggle("error", Boolean(errores[c])));
}

function modoRegistro() {
    editandoCodigo = null;
    $("formProducto").reset();
    $("codigo").readOnly = false;
    $("tituloForm").textContent = "Registrar producto";
    $("btnGuardar").textContent = "Guardar";
    $("btnCancelar").hidden = true;
    marcarErrores({});
}

/* ---------- T02_03: consulta del catálogo (HU02) ---------- */
function actualizarCategorias() {
    const select = $("filtroCategoria");
    const actual = select.value;
    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todas las categorías</option>';
    categorias.forEach(cat => {
        const op = document.createElement("option");
        op.value = cat;
        op.textContent = cat;
        select.appendChild(op);
    });
    select.value = categorias.includes(actual) ? actual : "";
}

function mostrarCatalogo() {
    const texto = $("buscar").value.trim().toLowerCase();
    const categoria = $("filtroCategoria").value;

    const lista = productos
        .filter(p => !categoria || p.categoria === categoria)
        .filter(p => p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const tbody = $("tablaProductos");
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td class="vacio" colspan="6">No se encontraron productos.</td></tr>';
        return;
    }

    lista.forEach(p => {
        const fila = document.createElement("tr");
        [p.codigo, p.nombre, p.categoria || "-", "$" + Number(p.precio).toFixed(2), p.existencias]
            .forEach(valor => {
                const td = document.createElement("td");
                td.textContent = valor; // textContent evita inyectar HTML
                fila.appendChild(td);
            });

        const tdAcc = document.createElement("td");
        const btn = document.createElement("button");
        btn.textContent = "Modificar";
        btn.className = "editar";
        btn.addEventListener("click", () => iniciarEdicion(p.codigo));
        tdAcc.appendChild(btn);
        fila.appendChild(tdAcc);

        tbody.appendChild(fila);
    });
}

/* ---------- T01 / T03_05: registrar y modificar ---------- */
function iniciarEdicion(codigo) {
    const p = productos.find(x => x.codigo === codigo);
    if (!p) return;

    editandoCodigo = codigo;
    CAMPOS.forEach(c => ($(c).value = p[c] ?? ""));
    $("codigo").readOnly = true; // el código no se puede modificar
    $("tituloForm").textContent = "Modificar producto";
    $("btnGuardar").textContent = "Guardar cambios";
    $("btnCancelar").hidden = false;
    marcarErrores({});
    mostrarMensaje("", "");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function alGuardar(evento) {
    evento.preventDefault();
    const datos = leerFormulario();
    const errores = validarProducto(datos, editandoCodigo);
    marcarErrores(errores);

    const primerError = Object.values(errores)[0];
    if (primerError) {
        mostrarMensaje(primerError, "err");
        return;
    }

    datos.precio = Number(datos.precio);
    datos.existencias = Number(datos.existencias);

    if (editandoCodigo) {
        if (!confirm("¿Deseas guardar los cambios del producto " + editandoCodigo + "?")) return;
        const i = productos.findIndex(p => p.codigo === editandoCodigo);
        productos[i] = datos;
        guardarProductos();
        modoRegistro();
        mostrarMensaje("Producto modificado correctamente.", "ok");
    } else {
        productos.push(datos);
        guardarProductos();
        modoRegistro();
        mostrarMensaje("Producto registrado correctamente.", "ok");
    }

    actualizarCategorias();
    mostrarCatalogo();
}

/* ---------- Inicio ---------- */
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarCategorias();
    mostrarCatalogo();

    $("formProducto").addEventListener("submit", alGuardar);
    $("btnCancelar").addEventListener("click", () => {
        modoRegistro();
        mostrarMensaje("", "");
    });
    $("buscar").addEventListener("input", mostrarCatalogo);
    $("filtroCategoria").addEventListener("change", mostrarCatalogo);
});