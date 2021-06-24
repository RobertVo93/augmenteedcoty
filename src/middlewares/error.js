module.exports = function (err, req, res, next) {
  if (err) {
    if (err.status) {
      res.status(err.status).json({
        success: false,
        message: err.message,
      });
    } else {
      res.status(404).json({
        success: false,
        message: `${err.name}: ${err.message}`,
      });
    }
    return;
  }
  // res.status(500).send("Something failed.");
};
