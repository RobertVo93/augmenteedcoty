const { Constants } = require("../utils/constants");

module.exports = {
    stackJobSchema: stackJobSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.stackJob; }).length === 0) {
                const stackJobSchema = new Parse.Schema(Constants.DBSchema.stackJob);
                stackJobSchema.addPointer('stack', Constants.DBSchema.stack);
                stackJobSchema.addPointer('job', Constants.DBSchema.job);
                stackJobSchema.addNumber('order');
                stackJobSchema.addString('version');
                stackJobSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.stackJob);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};