const { Constants } = require("../utils/constants");

module.exports = {
    stepSchema: stepSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.step; }).length === 0) {
                const stepSchema = new Parse.Schema(Constants.DBSchema.step);
                stepSchema.addPointer('customFields', Constants.DBSchema.stepCustom);
                stepSchema.addNumber('order');
                stepSchema.addBoolean('isActive');
                stepSchema.addString('version');
                stepSchema.addPointer('job', Constants.DBSchema.job);
                stepSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.step);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};