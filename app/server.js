const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('app/public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Servidor del Taller corriendo en http://localhost:${port}`);
});
