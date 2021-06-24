const { Constants } = require("../utils/constants");

module.exports = {
    jobSchema: jobSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.job; }).length === 0) {
                const jobSchema = new Parse.Schema(Constants.DBSchema.job);
                jobSchema.addPointer('customFields', Constants.DBSchema.jobCustom);
                jobSchema.addBoolean('isActive');
                jobSchema.addString('version');
                jobSchema.addPointer('catalog', Constants.DBSchema.catalog);
                jobSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.job);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};