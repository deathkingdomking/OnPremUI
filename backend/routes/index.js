const express = require('express');
const router = express.Router();
const services = require('../service/db_service');




/* GET home page. */
router.get('/', function(req, res) {
    services.query(req.query, (data) => {
        res.json(data);
    })
});

module.exports = router;
