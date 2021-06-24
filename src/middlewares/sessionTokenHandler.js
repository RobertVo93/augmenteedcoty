exports.verify = async (req, res, next) => {
  try {
    Parse.User.enableUnsafeCurrentUser();
    await Parse.User.become(req.headers["x-parse-session-token"]);
    next();
  }
  catch (err) {
    next({ status: 400, message: "Token or Access Name is not provided." });
  }
};
