// Router
const router = require("express").Router();
const usersController = require("../controllers/users");
const handler = require("../middlewares/sessionTokenHandler").verify;

router.post("/addusersforrole", handler, usersController.addUsersForRole);

module.exports = router;
