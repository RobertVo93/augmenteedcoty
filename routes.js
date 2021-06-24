const router = require("express").Router();
const usersRouter = require("./src/routes/users");
const jsonRouter = require("./src/routes/json_planner");

// Wire up routers
router.use("/users", usersRouter);
router.use("/planner", jsonRouter);

module.exports = router;
