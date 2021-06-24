"use strict";

exports.addUsersForRole = async (req, res, next) => {
    try {
        let result;
        const { userID, roleID } = req.body;

        const userQuery = new Parse.Query(Parse.User);
        userQuery.equalTo("objectId", userID);
        const user = await userQuery.find();

        const roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo("objectId", roleID);
        const role = await roleQuery.find();
        if(user.length == 1 && role.length == 1) {
            role[0].getUsers().add(user);
            result = await role[0].save();
        }
        res.status(200).json({ success: true, data: result });
    }
    catch (err) {
        next({
            status: 500,
            message: "Bad Request! " + err
        });
    }
}