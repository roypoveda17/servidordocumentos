const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 4000;

// Configuración de SQL Server
const sqlConfig = {
  user: 'sa',
  password: 'Rp170176!',
  database: 'appsci',
  server: 'localhost',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

app.use(cors());
app.use(express.json());

// MIME y caché para PWA / iconos (evita que Android reutilice el favicon de Angular)
express.static.mime.define({ 'application/manifest+json': ['webmanifest'] });
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  res.setHeader('X-SCI-Build', '8');
  if (
    p === '/' ||
    p === '/index.html' ||
    p === '/manifest.webmanifest' ||
    p === '/sw.js' ||
    p === '/version.json' ||
    p.endsWith('.webmanifest') ||
    p.includes('sci-icon') ||
    p.includes('sci-brand') ||
    p.includes('favicon') ||
    p.includes('apple-touch-icon')
  ) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  if (p === '/sw.js') {
    res.setHeader('Service-Worker-Allowed', '/');
    res.type('application/javascript');
  }
  next();
});

// Conexión persistente a SQL Server
let poolPromise;
async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(sqlConfig);
  }
  return poolPromise;
}

// Health / versión — para confirmar que el deploy nuevo está vivo
app.get('/api/version', (_req, res) => {
  res.json({
    name: 'SCI',
    build: 8,
    icon: 'sci-brand-7',
    modules: ['consulta', 'inventario', 'reporte', 'terminal'],
  });
});

// Catálogo demo para Terminal (fallback si no hay tabla productos)
const DEMO_PRODUCTOS = [
  { id: 'demo-1', codigo: 'CAF001', nombre: 'Café americano', precio: 1200, categoria: 'Bebidas' },
  { id: 'demo-2', codigo: 'CAF002', nombre: 'Café con leche', precio: 1500, categoria: 'Bebidas' },
  { id: 'demo-3', codigo: 'GAS001', nombre: 'Gaseosa 355ml', precio: 900, categoria: 'Bebidas' },
  { id: 'demo-4', codigo: 'AGU001', nombre: 'Agua 600ml', precio: 700, categoria: 'Bebidas' },
  { id: 'demo-5', codigo: 'SNA001', nombre: 'Empanada', precio: 1100, categoria: 'Comida' },
  { id: 'demo-6', codigo: 'SNA002', nombre: 'Sandwich mixto', precio: 2500, categoria: 'Comida' },
  { id: 'demo-7', codigo: 'SER001', nombre: 'Servicio técnico', precio: 15000, categoria: 'Servicios' },
  { id: 'demo-8', codigo: 'VAR001', nombre: 'Artículo general', precio: 5000, categoria: 'General' },
];

const ventasMemoria = [];

function toNumberSafe(raw) {
  const n = Number(String(raw ?? 0).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function normalizeProducto(row, index) {
  const id = String(row.id ?? row.Id ?? row.codigo ?? row.Codigo ?? `p-${index}`);
  const codigo = String(row.codigo ?? row.Codigo ?? row.sku ?? row.SKU ?? id);
  const nombre = String(
    row.nombre ?? row.Nombre ?? row.descripcion ?? row.Descripcion ?? row.producto ?? 'Producto'
  );
  const precio = toNumberSafe(row.precio ?? row.Precio ?? row.precioVenta ?? row.PrecioVenta ?? 0);
  const categoria = row.categoria ?? row.Categoria ?? row.grupo ?? undefined;
  return {
    id,
    codigo,
    nombre,
    precio,
    ...(categoria ? { categoria: String(categoria) } : {}),
  };
}

function filterProductos(list, q) {
  const qNorm = String(q || '').trim().toLowerCase();
  if (!qNorm) return list;
  return list.filter((p) =>
    [p.codigo, p.nombre, p.categoria || ''].join(' ').toLowerCase().includes(qNorm)
  );
}

// GET: catálogo del terminal (productos SQL o demo)
app.get('/api/terminal/productos', async (req, res) => {
  const q = req.query.q;
  try {
    const pool = await getPool();
    let rows = [];
    let fuente = 'demo';

    try {
      const result = await pool.request().query(
        'SELECT TOP 300 * FROM productos'
      );
      rows = result.recordset || [];
      if (rows.length > 0) fuente = 'sql:productos';
    } catch (_) {
      try {
        const result = await pool.request().query(
          'SELECT TOP 300 * FROM inventario'
        );
        rows = result.recordset || [];
        if (rows.length > 0) fuente = 'sql:inventario';
      } catch (__) {
        rows = [];
      }
    }

    const productos =
      rows.length > 0
        ? filterProductos(rows.map((r, i) => normalizeProducto(r, i)), q)
        : filterProductos(DEMO_PRODUCTOS, q);

    res.json({
      fuente: rows.length > 0 ? fuente : 'demo',
      productos,
    });
  } catch (err) {
    console.error('Error cargando productos terminal:', err.message);
    res.json({
      fuente: 'demo',
      productos: filterProductos(DEMO_PRODUCTOS, q),
    });
  }
});

// POST: registrar venta en terminal
app.post('/api/terminal/ventas', async (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'La venta no tiene ítems.' });
    }

    const pago = ['efectivo', 'tarjeta', 'sinpe'].includes(body.pago) ? body.pago : 'efectivo';
    const cliente = String(body.cliente || 'Cliente contado').trim() || 'Cliente contado';
    const normalizedItems = items.map((it, i) => ({
      id: String(it.id ?? `item-${i}`),
      codigo: String(it.codigo ?? ''),
      nombre: String(it.nombre ?? 'Producto'),
      precio: toNumberSafe(it.precio),
      cantidad: Math.max(1, Math.floor(toNumberSafe(it.cantidad) || 1)),
    }));

    const subtotalCalc = normalizedItems.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    const subtotal = toNumberSafe(body.subtotal) || Math.round(subtotalCalc * 100) / 100;
    const iva = toNumberSafe(body.iva) || Math.round(subtotal * 0.13 * 100) / 100;
    const total = toNumberSafe(body.total) || Math.round((subtotal + iva) * 100) / 100;

    const now = new Date();
    const ticket = `T${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(ventasMemoria.length + 1).padStart(4, '0')}`;

    const venta = {
      ticket,
      cliente,
      pago,
      subtotal,
      iva,
      total,
      fecha: now.toISOString(),
      items: normalizedItems,
      persistido: false,
    };

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('ticket', sql.VarChar, ticket)
        .input('cliente', sql.VarChar, cliente)
        .input('pago', sql.VarChar, pago)
        .input('subtotal', sql.Decimal(18, 2), subtotal)
        .input('iva', sql.Decimal(18, 2), iva)
        .input('total', sql.Decimal(18, 2), total)
        .input('detalle', sql.NVarChar(sql.MAX), JSON.stringify(normalizedItems))
        .query(`
          INSERT INTO ventasterminal (ticket, cliente, pago, subtotal, iva, total, detalle, fecha)
          VALUES (@ticket, @cliente, @pago, @subtotal, @iva, @total, @detalle, GETDATE())
        `);
      venta.persistido = true;
    } catch (sqlErr) {
      console.warn('Venta terminal en memoria (tabla ventasterminal no disponible):', sqlErr.message);
      venta.persistido = false;
    }

    ventasMemoria.unshift(venta);
    if (ventasMemoria.length > 200) ventasMemoria.length = 200;

    res.status(201).json(venta);
  } catch (err) {
    console.error('Error registrando venta terminal:', err);
    res.status(500).json({ error: 'No se pudo registrar la venta' });
  }
});

// GET: últimas ventas del terminal (memoria del proceso)
app.get('/api/terminal/ventas', (_req, res) => {
  res.json({ total: ventasMemoria.length, items: ventasMemoria.slice(0, 50) });
});

// Variables en memoria para token (declaradas una sola vez)
let haciendaToken = null;
let haciendaTokenExpiration = null;

// GET: consulta todos los registros de archivoshacienda
app.get('/api/archivoshacienda', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM archivoshacienda');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en SQL:', err);
    res.status(500).json({ error: 'Error consultando la base de datos' });
  }
});

// GET: consulta por clave electrónica en tu BD local
app.get('/api/facturas/:clave', async (req, res) => {
  const clave = req.params.clave;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('clave', sql.VarChar, clave)
      .query('SELECT * FROM archivoshacienda WHERE claveelectronica = @clave');
    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Factura no encontrada en BD local' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error en SQL:', err);
    res.status(500).json({ error: 'Error consultando la base de datos' });
  }
});

// Consulta a Hacienda por clave electrónica usando token en memoria
app.get('/api/hacienda/facturas/:clave', async (req, res) => {
  const clave = req.params.clave;
  try {
    if (!haciendaToken || Date.now() > haciendaTokenExpiration) {
      return res.status(401).json({ error: 'Token de Hacienda no disponible o expirado' });
    }

    const response = await axios.get(`https://api.hacienda.go.cr/fe/recepcion/${clave}`, {
      headers: { Authorization: `Bearer ${haciendaToken}` }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error consultando Hacienda:', err.message);
    res.status(500).json({ error: 'No se pudo consultar la API de Hacienda' });
  }
});

// Endpoint para pedir y guardar token en memoria
app.post('/api/hacienda/token', async (req, res) => {
  try {
    console.log('Paso 1: conectando a SQL...');
    const pool = await sql.connect(sqlConfig);

    console.log('Paso 2: ejecutando query credenciales...');
    const cred = await pool.request().query(
      'SELECT TOP 1 h.usuarioAPI, h.claveAPI, h.id, a.Token, a.urlRecepcion, a.api FROM hacienda as h INNER JOIN atv AS a ON a.id=1'
    );
    console.log('Resultado credenciales:', cred.recordset);

    if (cred.recordset.length === 0) {
      console.log('Paso 3: no hay credenciales en BD');
      return res.status(500).json({ error: 'No hay credenciales en la base de datos' });
    }

    const { usuarioAPI, claveAPI, id, Token } = cred.recordset[0];
    console.log('Paso 4: credenciales obtenidas:', { usuarioAPI, id, Token });

    console.log('Paso 5: pidiendo token a Hacienda...');
    const response = await axios.post(Token, new URLSearchParams({
      client_id: id,
      grant_type: 'password',
      username: usuarioAPI,
      password: claveAPI
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log('Paso 6: respuesta de Hacienda:', response.data);

    haciendaToken = response.data.access_token;
    haciendaTokenExpiration = Date.now() + response.data.expires_in * 1000;

    console.log('Paso 7: token guardado en memoria hasta:', new Date(haciendaTokenExpiration));

    res.json({ mensaje: 'Token creado correctamente', token: haciendaToken });
  } catch (err) {
    console.error('Error en algún paso:', err.message);
    res.status(500).json({ error: 'No se pudo crear el token en Hacienda' });
  }
});

// GET: reporte de documentos electrónicos (inventario filtrado + resumen)
app.get('/api/reportes/documentos', async (req, res) => {
  const { desde, hasta, estado, q } = req.query;
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM archivoshacienda');
    let rows = result.recordset || [];

    const qNorm = String(q || '').trim().toLowerCase();
    const estadoNorm = String(estado || '').trim().toLowerCase();
    const desdeNorm = String(desde || '').trim();
    const hastaNorm = String(hasta || '').trim();

    rows = rows.filter((doc) => {
      const estadoDoc = String(doc.estado ?? '').toLowerCase();
      const fecha = String(doc.fecha ?? doc.fechadocumento ?? '');
      const blob = [
        doc.claveelectronica,
        doc.clave,
        doc.cliente,
        doc.nombrecliente,
        doc.estado,
      ]
        .join(' ')
        .toLowerCase();

      if (qNorm && !blob.includes(qNorm)) return false;
      if (estadoNorm && !estadoDoc.includes(estadoNorm)) return false;
      if (desdeNorm && fecha && fecha < desdeNorm) return false;
      if (hastaNorm && fecha && fecha > hastaNorm) return false;
      return true;
    });

    const toNumber = (doc) => {
      const raw = doc.monto ?? doc.total ?? 0;
      const n = Number(String(raw).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const aceptados = rows.filter((d) => /acept|ok|autoriz/i.test(String(d.estado ?? ''))).length;
    const rechazados = rows.filter((d) => /rechaz|error|anul/i.test(String(d.estado ?? ''))).length;

    res.json({
      total: rows.length,
      aceptados,
      rechazados,
      pendientes: Math.max(rows.length - aceptados - rechazados, 0),
      montoTotal: rows.reduce((acc, d) => acc + toNumber(d), 0),
      items: rows.slice(0, 100),
    });
  } catch (err) {
    console.error('Error generando reporte:', err);
    res.status(500).json({ error: 'Error generando el reporte' });
  }
});

// Servir Angular compilado
const distFolder = path.join(__dirname, 'dist/servidordocumentos/browser');
app.use(
  express.static(distFolder, {
    setHeaders(res, filePath) {
      const base = path.basename(filePath).toLowerCase();
      if (base === 'index.html' || base === 'sw.js' || base === 'version.json' || base.endsWith('.webmanifest')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(distFolder, 'index.html'));
});

// Escuchar en todas las interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor Express escuchando en http://0.0.0.0:${port}`);
});
