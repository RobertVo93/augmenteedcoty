const { Constants } = require("../utils/constants");

module.exports = {
    stackSchema: stackSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.stack; }).length === 0) {
                const stackSchema = new Parse.Schema(Constants.DBSchema.stack);
                stackSchema.addPointer('project', Constants.DBSchema.project);
                stackSchema.addNumber('order');
                stackSchema.addString('name');
                stackSchema.addArray('devices');
                stackSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.stack);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};