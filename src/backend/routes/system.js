const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/', systemController.getSystemInfo);
router.get('/cpu', systemController.getCpuLoad);
router.get('/memory', systemController.getMemoryInfo);
router.get('/network', systemController.getNetworkInfo);

module.exports = router;