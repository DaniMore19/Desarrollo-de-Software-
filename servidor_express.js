// Importamos express
import express from 'express';

// Importamos path para manejar rutas
import path from 'path';

// Importamos fileURLToPath para obtener __dirname
import { fileURLToPath } from 'url';

// Creamos la aplicación
const app = express();

// Estas variables ayudan a encontrar archivos correctamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express.static permite usar archivos estáticos como imágenes o CSS
// Honestamente, esta parte me pareció muy útil porque simplifica mucho
// el manejo de imágenes y otros archivos.
app.use(express.static('public'));

// Página principal
app.get('/', (req, res) => {
    res.send('Bienvenido al servidor con Express');
});

// Página de opinión
app.get('/opinion', (req, res) => {
    res.send('Mi opinión es que Express hace mucho más sencillo crear servidores web.');
});

// Página HTML del árbol
app.get('/arbol', (req, res) => {
    res.sendFile(path.join(__dirname, 'arbol.html'));
});

// Me gustó Express porque el código es más corto y organizado
// comparado con crear un servidor usando únicamente Node.js.

// Iniciamos el servidor
app.listen(1984, () => {
    console.log('Servidor funcionando en puerto 1984');
});