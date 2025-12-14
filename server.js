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

// Conexión persistente a SQL Server
let poolPromise;
async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(sqlConfig);
  }
  return poolPromise;
}

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

// Servir Angular compilado
const distFolder = path.join(__dirname, 'dist/servidordocumentos/browser');
app.use(express.static(distFolder));

app.use((req, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

// Escuchar en todas las interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor Express escuchando en http://0.0.0.0:${port}`);
});
