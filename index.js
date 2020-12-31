// Require the framework and instantiate it
// const fastify = require('fastify')({ logger: true, ignoreTrailingSlash: true, maxParamLength: 1000 })
const routes = require('./routes');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({origin: '*', methods: 'GET'}));
app.use(routes);
app.use(express.static(path.join(__dirname, 'public')));
// Handle 404
app.use(function(req, res) {
  res.status(404).send('404: Page not Found');
});

// Handle 500
app.use(function(error, req, res, next) {
  res.status(500).send('500: Internal Server Error');
});

const PORT = process.env.PORT || 3001;
app.listen( PORT, console.log(`server listening on ${PORT}`))
