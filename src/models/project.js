const { Constants } = require("../utils/constants");

module.exports = {
    projectSchema: projectSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.project; }).length === 0) {
                const projectSchema = new Parse.Schema(Constants.DBSchema.project);
                projectSchema.addString('brand');
                projectSchema.addString('name');
                projectSchema.addString('manager');
                projectSchema.addString('product');
                projectSchema.addNumber('startTime');
                projectSchema.addNumber('stopTime');
                projectSchema.addString('line');
                projectSchema.addString('irc');
                projectSchema.addString('volume');
                projectSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.project);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};