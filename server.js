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
  res.setHeader('X-SCI-Build', '9');
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
    build: 9,
    icon: 'sci-brand-7',
    modules: ['cuentas', 'consulta', 'inventario', 'reporte'],
  });
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

const DEMO_PRODUCTOS_BAR = [
  { id: 'sil350', codigo: 'SIL350', nombre: 'Silver 350ML', precio: 1500 },
  { id: 'imp350', codigo: 'IMP350', nombre: 'Imperial 350ML', precio: 1400 },
  { id: 'caf001', codigo: 'CAF001', nombre: 'Café americano', precio: 1200 },
  { id: 'agua01', codigo: 'AGU001', nombre: 'Agua 600ml', precio: 700 },
];

let cuentasBar = [
  {
    id: 'cta-1',
    nombre: 'camisa verde',
    atiende: '05',
    estado: 'Abierta',
    personas: 1,
    items: [{ id: 'sil350', nombre: 'Silver 350ML', cantidad: 2, precio: 1500 }],
  },
  { id: 'cta-2', nombre: 'javi', atiende: '05', estado: 'Abierta', personas: 1, items: [] },
  { id: 'cta-3', nombre: 'BARRA-01', atiende: '05', estado: 'Abierta', personas: 1, items: [] },
];

function formatTipoCambio(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : fallback;
}

app.get('/api/bar/sesion', async (_req, res) => {
  let compra = '446.85';
  let venta = '452.18';
  try {
    const tc = await axios.get('https://api.hacienda.go.cr/indicadores/tc/dolar', { timeout: 4000 });
    const data = tc.data || {};
    compra = formatTipoCambio(data.compra?.valor ?? data.compra, compra);
    venta = formatTipoCambio(data.venta?.valor ?? data.venta, venta);
  } catch (_) {
    /* usa fallback */
  }
  res.json({
    empresas: [{ id: 'hottsun', nombre: 'HOTTSUN S.A.', identificacion: '3101467571' }],
    compra,
    venta,
  });
});

app.get('/api/bar/cuentas', (_req, res) => {
  res.json(cuentasBar);
});

app.post('/api/bar/cuentas', (req, res) => {
  const nombre = String(req.body?.nombre || '').trim();
  const personas = Math.max(1, Math.floor(Number(req.body?.personas) || 1));
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la cuenta es obligatorio.' });
  }
  const cuenta = {
    id: `cta-${Date.now()}`,
    nombre,
    atiende: '05',
    estado: 'Abierta',
    personas,
    items: [],
  };
  cuentasBar.unshift(cuenta);
  res.status(201).json(cuenta);
});

app.get('/api/bar/productos', (_req, res) => {
  res.json({ productos: DEMO_PRODUCTOS_BAR });
});

app.post('/api/bar/cuentas/:id/productos', (req, res) => {
  const cuenta = cuentasBar.find((c) => c.id === req.params.id);
  if (!cuenta) {
    return res.status(404).json({ error: 'Cuenta no encontrada.' });
  }
  const producto = DEMO_PRODUCTOS_BAR.find((p) => p.id === String(req.body?.productoId || ''));
  if (!producto) {
    return res.status(400).json({ error: 'Producto no válido.' });
  }
  const cantidad = Math.max(1, Math.floor(Number(req.body?.cantidad) || 1));
  const linea = cuenta.items.find((it) => it.id === producto.id);
  if (linea) {
    linea.cantidad += cantidad;
  } else {
    cuenta.items.push({
      id: producto.id,
      nombre: producto.nombre,
      cantidad,
      precio: producto.precio,
    });
  }
  res.json(cuenta);
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
