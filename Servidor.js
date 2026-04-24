import http from 'http';
import { URL } from 'url';

const apiKeys = {
  daniel: 'uX0sI4XNZuQFfqiHVbQhvVTxkmf2oqfr',
};

const CALENDARIFIC_API_KEY = process.env.CALENDARIFIC_API_KEY || 'uX0sI4XNZuQFfqiHVbQhvVTxkmf2oqfr';

// Base de datos de usuarios de ejemplo
const usuarios = [
  { id: 1, nombre: 'Juan García', email: 'juan@example.com', edad: 28 },
  { id: 2, nombre: 'María López', email: 'maria@example.com', edad: 32 },
  { id: 3, nombre: 'Carlos Rodríguez', email: 'carlos@example.com', edad: 25 },
  { id: 4, nombre: 'Ana Martínez', email: 'ana@example.com', edad: 29 },
  { id: 5, nombre: 'Pedro Sánchez', email: 'pedro@example.com', edad: 35 },
  { id: 6, nombre: 'Laura González', email: 'laura@example.com', edad: 27 },
  { id: 7, nombre: 'Roberto Díaz', email: 'roberto@example.com', edad: 31 },
  { id: 8, nombre: 'Elena Fernández', email: 'elena@example.com', edad: 26 },
];

function validarApiKey(req, url) {
  const apiKeyHeader = req.headers['x-api-key'];
  const apiKeyQuery = url.searchParams.get('apiKey');

  const apiKey = apiKeyHeader || apiKeyQuery;

  return Object.values(apiKeys).includes(apiKey);
}
async function fetchHolidays(country = 'US', year = new Date().getFullYear()) {
  const url = new URL('https://calendarific.com/api/v2/holidays');
  url.searchParams.set('api_key', CALENDARIFIC_API_KEY);
  url.searchParams.set('country', country);
  url.searchParams.set('year', String(year));

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Calendarific error ${resp.status}`);
  }
  return resp.json();
}

const servidor = http.createServer((req, res) => {
  if (!validarApiKey(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API key inválida o ausente' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/holidays') {
    const country = url.searchParams.get('country') || 'US';
    const year = url.searchParams.get('year') || new Date().getFullYear();

    fetchHolidays(country, year)
      .then(data => {
        const holidays = (data.response?.holidays || []).map(holiday => ({
          nombre: holiday.name,
          fecha: holiday.date.iso,
          descripcion: holiday.description,
          tipo: holiday.type
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ country, year, holidays }));
      })
      .catch(error => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      });

    return;
  }

  if (req.method === 'POST' && url.pathname === '/data') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      let recibido;
      try {
        recibido = JSON.parse(body || '{}');
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON inválido' }));
        return;
      }

      const respuesta = {
        mensaje: 'Datos recibidos correctamente',
        recibido,
        aviso: 'Este POST devuelve datos al cliente'
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(respuesta));
    });

    return;
  }

  if (req.method === 'GET' && url.pathname === '/usuarios') {
    try {
      // Obtener parámetros de paginación
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 10;

      // Validar parámetros
      if (page < 1 || limit < 1) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Los parámetros page y limit deben ser mayores a 0' }));
        return;
      }

      // Calcular índices para la paginación
      const totalUsuarios = usuarios.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      // Obtener usuarios de la página actual
      const usuariosPaginados = usuarios.slice(startIndex, endIndex);

      // Calcular total de páginas
      const totalPages = Math.ceil(totalUsuarios / limit);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: usuariosPaginados,
        pagination: {
          page,
          limit,
          total: totalUsuarios,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error interno del servidor' }));
    }

    return;
  }

  if (req.method === 'POST' && url.pathname === '/usuarios') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      let nuevoUsuario;

      try {
        nuevoUsuario = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON inválido' }));
        return;
      }

      // Validación básica
      if (!nuevoUsuario.nombre || !nuevoUsuario.email) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Nombre y email son obligatorios' }));
        return;
      }

      // Crear usuario
      const nuevoId = usuarios.length + 1;
      const usuarioCreado = {
        id: nuevoId,
        ...nuevoUsuario
      };

      usuarios.push(usuarioCreado);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Usuario creado correctamente',
        data: usuarioCreado
      }));
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

const puerto = process.env.PORT || 1999;
servidor.listen(puerto, () => {
  console.log(`Servidor escuchando en el puerto ${puerto}`);
});





