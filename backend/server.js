const express = require('express');
const cors = require('cors');


const { PORT } = require('./config/constants');
const { initDB } = require('./database');
const routes = require('./routes/index');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/', routes);

/* ---------- Arranque: espera a que la BD esté lista ---------- */
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al inicializar la BD:', err);
    process.exit(1);
  });