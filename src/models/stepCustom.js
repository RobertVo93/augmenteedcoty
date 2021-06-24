const { Constants } = require("../utils/constants");

module.exports = {
    stepCustomSchema: stepCustomSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.stepCustom; }).length === 0) {
                const stepCustomSchema = new Parse.Schema(Constants.DBSchema.stepCustom);
                stepCustomSchema.addString('type');
                stepCustomSchema.addString('title');
                stepCustomSchema.addString('instruction');
                stepCustomSchema.addString('tool');
                stepCustomSchema.addBoolean('timed');
                stepCustomSchema.addArray('medias');
                stepCustomSchema.addString('repere');
                stepCustomSchema.addString('zone');
                stepCustomSchema.addString('valStd');
                stepCustomSchema.addString('valCalc');
                stepCustomSchema.addNumber('stdTime');
                stepCustomSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.stepCustom);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};