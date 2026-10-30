const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');

router.get('/', processController.getAllProcesses);
router.get('/summary', processController.getProcessSummary);
router.get('/tree', processController.getProcessTree);
router.get('/:pid', processController.getProcessDetail);
router.post('/:pid/kill', processController.killProcess);

module.exports = router;