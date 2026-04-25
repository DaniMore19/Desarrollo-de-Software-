import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

// Leer variables de entorno desde .env
const envPath = path.join(process.cwd(), '.env');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('No se pudo leer .env, usando valores por defecto');
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const apiKeys = {
  daniel: 'xZB4vDywABN4DlWjWMdXcQPgmTrvPwDX',
};

const OPENWEATHER_API_KEY = envVars.OPENWEATHER_API_KEY || 'a22e50b3f75bba0c883290d3e58e3668';

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
async function fetchWeather(lat = 40.4165, lon = -3.7026, exclude = 'minutely,hourly') {
  const url = new URL('https://api.openweathermap.org/data/3.0/onecall');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('exclude', exclude);
  url.searchParams.set('appid', OPENWEATHER_API_KEY);
  url.searchParams.set('units', 'metric'); // Para obtener temperaturas en Celsius
  url.searchParams.set('lang', 'es'); // Para descripciones en español

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`OpenWeatherMap error ${resp.status}`);
  }
  return resp.json();
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (!validarApiKey(req, url)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API key inválida o ausente' }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/weather') {
    const lat = parseFloat(url.searchParams.get('lat')) || 40.4165; // Madrid por defecto
    const lon = parseFloat(url.searchParams.get('lon')) || -3.7026; // Madrid por defecto
    const exclude = url.searchParams.get('exclude') || 'minutely,hourly';

    fetchWeather(lat, lon, exclude)
      .then(data => {
        const weather = {
          ubicacion: {
            latitud: lat,
            longitud: lon
          },
          actual: {
            temperatura: data.current.temp,
            sensacion_termica: data.current.feels_like,
            humedad: data.current.humidity,
            descripcion: data.current.weather[0].description,
            icono: data.current.weather[0].icon
          },
          pronostico: data.daily.slice(0, 7).map(day => ({
            fecha: new Date(day.dt * 1000).toISOString().split('T')[0],
            temperatura_max: day.temp.max,
            temperatura_min: day.temp.min,
            descripcion: day.weather[0].description,
            icono: day.weather[0].icon,
            probabilidad_lluvia: day.pop * 100
          }))
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(weather));
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





