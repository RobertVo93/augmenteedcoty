const catalog = require("./catalog");
const catalogCustom = require("./catalogCustom");
const job = require("./job");
const jobCustom = require("./jobCustom");
const step = require("./step");
const stepCustom = require("./stepCustom");
const project = require("./project");
const stack = require("./stack");
const stackJob = require("./stackJob");
const stackStep = require("./stackStep");
const models = {
    initialDBSchema: () => {
        catalogCustom.catalogCustomSchema();
        catalog.catalogSchema();
        jobCustom.jobCustomSchema();
        job.jobSchema();
        stepCustom.stepCustomSchema();
        step.stepSchema();
        project.projectSchema();
        stack.stackSchema();
        stackJob.stackJobSchema();
        stackStep.stackStepSchema();
        //create a new super admin user, super admin role, admin role, manager role
        const userQ = new Parse.Query(Parse.User);
        userQ.equalTo('username', 'superadmin');
        userQ.find().then(async (result) => {
            var user;
            if (result.length == 0) {
                //check if admin is not existed => create new user
                user = new Parse.User();
                user.setUsername("superadmin", null);
                user.setPassword(process.env.SUPER_ADMIN_PASSWORD, null);
                await user.save();
            }
            else {
                user = result[0];
            }
            //create new Super Admin role
            var quSuperAdmin = new Parse.Query(Parse.Role);
            quSuperAdmin.equalTo("name", "SuperAdmin");
            quSuperAdmin.count().then((quResult) => {
                if (quResult == 0) {
                    //only Super admin can have write permission to this ACL
                    var superAdminRoleACL = new Parse.ACL();
                    superAdminRoleACL.setPublicReadAccess(true);
                    superAdminRoleACL.setWriteAccess(user, true);
    
                    var superAdminRole = new Parse.Role("SuperAdmin", superAdminRoleACL);
                    superAdminRole.getUsers().add(user);
                    superAdminRole.save();
                }                
            });
            //create new Admin role
            let quAdmin = new Parse.Query(Parse.Role);
            quAdmin.equalTo("name", "Admin");
            quAdmin.count().then((quResult) => {
                if (quResult == 0) {
                    //only Super admin can have write permission to this ACL
                    var adminRoleACL = new Parse.ACL();
                    adminRoleACL.setPublicReadAccess(true);
                    adminRoleACL.setWriteAccess(user, true);
    
                    var adminRole = new Parse.Role("Admin", adminRoleACL);
                    adminRole.save();
                }                
            });
            //Create new Manager role
            let quManager = new Parse.Query(Parse.Role);
            quManager.equalTo("name", "Manager");
            quManager.count().then((quResult) => {
                if (quResult == 0) {
                    //only Super admin can have write permission to this ACL
                    var managerRoleACL = new Parse.ACL();
                    managerRoleACL.setPublicReadAccess(true);
                    managerRoleACL.setWriteAccess(user, true);
    
                    var managerRole = new Parse.Role("Manager", managerRoleACL);
                    managerRole.set("allowedPages", ["importexcel"]);
                    managerRole.save();
                }                
            });
        });
    },
    catalogSchema: catalog,
    catalogCustomSchema: catalogCustom,
    jobSchema: job,
    jobCustomSchema: jobCustom,
    stepSchema: step,
    stepCustomSchema: stepCustom,
    projectSchema: project,
    stackSchema: stack,
    stackJobSchema: stackJob,
    stackStepSchema: stackStep
}

module.exports = models;