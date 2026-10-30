const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

router.get('/', logController.getJournalLogs);
router.get('/units', logController.getLogUnits);
router.get('/dmesg', logController.getDmesgLogs);

module.exports = router;