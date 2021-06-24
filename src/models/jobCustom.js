const { Constants } = require("../utils/constants");

module.exports = {
    jobCustomSchema: jobCustomSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.jobCustom; }).length === 0) {
                const jobCustomSchema = new Parse.Schema(Constants.DBSchema.jobCustom);
                jobCustomSchema.addString('name');
                jobCustomSchema.addString('line');
                jobCustomSchema.addString('type');
                jobCustomSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.jobCustom);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};