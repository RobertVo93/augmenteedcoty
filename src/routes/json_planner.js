// Router
const router = require("express").Router();

const jsonController = require("../controllers/json_planner");
const handler = require("../middlewares/sessionTokenHandler").verify;

router.post("/readcsv", handler, jsonController.readCSVFile);

module.exports = router;
