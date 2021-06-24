const { Constants } = require("../utils/constants");

module.exports = {
    catalogCustomSchema: catalogCustomSchema = () => {
        Parse.Schema.all().then(result => {
            if (result.filter(val => { return val.className == Constants.DBSchema.catalogCustom; }).length === 0) {
                const catalogCustomSchema = new Parse.Schema(Constants.DBSchema.catalogCustom);
                catalogCustomSchema.addArray('ircs');
                catalogCustomSchema.addString('brand');
                catalogCustomSchema.addString('product');
                catalogCustomSchema.addString('volume');
                catalogCustomSchema.save();
            }
        }).catch(err => {
            console.log(err);
        });
    },
    insert: insert = (newObj) => {
        return new Promise((resolve, reject) => {
            const recordObject = new Parse.Object(Constants.DBSchema.catalogCustom);
            recordObject.set(newObj);
            recordObject.save().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            })
        });
    }
};