const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/', serviceController.getAllServices);
router.get('/search', serviceController.searchServices);
router.get('/:serviceName', serviceController.getServiceDetail);
router.post('/:serviceName/control', serviceController.controlService);

module.exports = router;