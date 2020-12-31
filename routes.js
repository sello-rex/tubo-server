const express = require('express')
  , router = express.Router();
const controller = require('./controller')

router.get('/', (req, res)=>{
  res.send('Welcome to tubo')
});

router.get('/fromyoutube', (req, res)=>{
  controller.convert(req, res);
});

router.get('/download', (req, res)=>{
  controller.download(req, res);
});

module.exports = router;