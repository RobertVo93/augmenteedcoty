const { Constants } = require("../utils/constants");

module.exports = {
    stackStepSchema: stackStepSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.stackStep; }).length === 0) {
                const stackStepSchema = new Parse.Schema(Constants.DBSchema.stackStep);
                stackStepSchema.addPointer('step', Constants.DBSchema.step);
                stackStepSchema.addString('assignee');
                stackStepSchema.addNumber('stopTime');
                stackStepSchema.addNumber('startTime');
                stackStepSchema.addString('status');
                stackStepSchema.addPointer('stackJob', Constants.DBSchema.stackJob);
                stackStepSchema.addString('version');
                stackStepSchema.addString('comment');
                stackStepSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.stackStep);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};