const { Constants } = require("../utils/constants");

module.exports = {
    catalogSchema: catalogSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.catalog; }).length === 0) {
                const catalogSchema = new Parse.Schema(Constants.DBSchema.catalog);
                catalogSchema.addBoolean('isActive');
                catalogSchema.addString('version');
                catalogSchema.addPointer('customFields', Constants.DBSchema.catalogCustom)
                catalogSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.catalog);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};