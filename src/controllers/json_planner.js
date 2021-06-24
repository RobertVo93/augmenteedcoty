"use strict";
const Excel = require('exceljs');
const path = require('path');
const fs = require('fs');
const { stepCustomSchema, stepSchema, jobCustomSchema, jobSchema, catalogCustomSchema, catalogSchema } = require('../models');
const { getValueOfCell } = require('../utils/common');
const { Constants } = require('../utils/constants');
String.prototype.replaceAllTxt = function replaceAll(search, replace) { return this.split(search).join(replace); }

/**
 * Get Catalog Object from ircs, product, brand, volume
 * @param {*} ircs 
 * @param {*} product 
 * @param {*} brand 
 * @param {*} volume 
 * @returns Job Schema
 */
const retrieveCatalog = async (ircs, product, brand, volume) => {
    let result;
    product = (product || '').toString().replaceAllTxt("\n", " ");
    //check whether catalog is existing in db
    let jobIRCSArr = ircs.toString().replaceAllTxt(" ", "").split('-');
    let catalogClass = new Parse.Query(Constants.DBSchema.catalogCustom);
    catalogClass.equalTo('ircs', jobIRCSArr[0]);
    catalogClass.equalTo('brand', brand);
    catalogClass.equalTo('product', product);
    catalogClass.equalTo('volume', volume);
    let catalogCustomObject = await catalogClass.find();
    if (catalogCustomObject.length === 0) {
        //new catalog => save to db
        let catalogCustomObj = await catalogCustomSchema.insert({
            ircs: jobIRCSArr,
            brand: brand,
            product: product,
            volume: volume,
        });
        result = await catalogSchema.insert({
            version: "1.0",
            isActive: true,
            customFields: catalogCustomObj
        });
    } else {
        //existing => get the existing one
        let catalogQuery = new Parse.Query(Constants.DBSchema.catalog);
        catalogQuery.equalTo('customFields', catalogCustomObject[0]);
        let catalogQueryResult = await catalogQuery.find();
        if (catalogQueryResult.length > 0) {
            result = catalogQueryResult[0];
        }
    }
    return result;
}
/**
 * Generate Job stack type = machine
 * @param {*} worksheet 
 */
const generateJobTypeMachine = (worksheet) => {
    //get job stack name, type, line from excel sheet
    let jobStackName = getValueOfCell(worksheet, Constants.machineJson.name);
    let jobStackType = getValueOfCell(worksheet, Constants.machineJson.type);
    let jobStackLine = getValueOfCell(worksheet, Constants.machineJson.line);
    //define initial jobstack json object
    let jobStackJson = {
        "id": null,
        "name": jobStackName,
        "type": jobStackType,
        "line": jobStackLine,
        "jobs": []
    };
    //define job's information
    let jobIndex = 1, jobIRCS = true, jobNo = true, jobBrand, jobProduct, jobVolume, jobJsonObj;
    while (jobIRCS || jobNo) {
        //get job IRCS, Number, Brand, Product, Volume from excel sheet
        jobIRCS = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.ircs);
        jobNo = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.no);
        jobBrand = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.brand);
        jobProduct = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.product);
        jobVolume = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.volume);
        // Just handle row that has IRCS and number
        if (jobIRCS && jobNo) {
            // Define job json object with the first step instruction
            jobJsonObj = {
                "id": null,
                "version": "1.0",
                "isActive": true,
                "details": {
                    "brand": jobBrand,
                    "product": jobProduct,
                    "volume": jobVolume,
                    "ircs": jobIRCS.toString().replaceAllTxt(" ", "").split('-')
                },
                "steps": [
                    {
                        "id": null,
                        "version": "1.0",
                        "order": 0,
                        "isActive": true,
                        "type": "location",
                        "title": "Localisation",
                        "instruction": "Rendez-vous à:",
                        "tool": "",
                        "timed": false,
                        "medias": [`/images/${jobStackLine}/${jobStackType}/${jobStackName}/localisation.png`],
                        "repere": "",
                        "zone": "",
                        "valStd": "",
                        "valCalc": "",
                        "stdTime": null
                    }
                ]
            };
            let stepOrder = true,
                stepType,
                stepTitle,
                stepInstruction,
                stepTool,
                stepMediaPath,
                stepRepere,
                stepZone,
                stepValStd,
                stepValCalc,
                stepStdTime,
                stepJsonObj,
                stepJsonObjForNewZone,
                stepIndex = 1;
            //just handle column that have order
            while (stepOrder) {
                stepType = null;
                stepTitle = null;
                stepInstruction = null;
                stepTool = null;
                stepMediaPath = null;
                stepRepere = null;
                stepValStd = null;
                stepValCalc = null;
                stepStdTime = null;
                stepOrder = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).order);
                //just handle step is interger
                if (Number.isInteger(stepOrder)) {
                    //get step's information from excel sheet
                    stepTitle = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).title);
                    stepInstruction = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).instruction);
                    stepTool = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).tool);
                    stepRepere = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).repere);
                    stepValStd = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).valStd);
                    stepValCalc = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).valCalc);
                    stepStdTime = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).stdTime);
                    // If the current zone is different from the previous zone => add new instruction step
                    if (stepZone != getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).zone)) {
                        stepZone = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).zone);
                        //define step josn object for new zone
                        stepJsonObjForNewZone = {
                            "id": null,
                            "version": "1.0",
                            "order": stepOrder - 0.5,
                            "isActive": true,
                            "type": "location",
                            "title": "Localisation",
                            "instruction": "Rendez-vous à:",
                            "tool": "",
                            "timed": false,
                            "medias": [`/images/${jobStackLine}/${jobStackType}/${jobStackName}/zone${stepZone}.png`],
                            "repere": "",
                            "zone": "",
                            "valStd": "",
                            "valCalc": "",
                            "stdTime": null
                        }
                        jobJsonObj.steps.push(stepJsonObjForNewZone);
                    }
                    //check if the image is existing in folder
                    stepType = "instructionText";
                    stepMediaPath = `/images/${jobStackLine}/${jobStackType}/${jobStackName}/${stepOrder}.png`;
                    if (fs.existsSync(path.join(process.cwd(), stepMediaPath))) {
                        stepType = 'instructionTextMediaValue';
                    }
                    else {
                        stepMediaPath = '';
                    }
                    //define step json object
                    stepJsonObj = {
                        "id": null,
                        "version": "1.0",
                        "order": stepOrder,
                        "isActive": true,
                        "type": stepType,
                        "title": stepTitle,
                        "instruction": stepInstruction,
                        "tool": stepTool,
                        "timed": true,
                        "medias": [stepMediaPath],
                        "repere": stepRepere,
                        "zone": stepZone,
                        "valStd": stepValStd,
                        "valCalc": stepValCalc,
                        "stdTime": stepStdTime || 300
                    };
                    jobJsonObj.steps.push(stepJsonObj)
                }
                stepIndex++;
            }
            jobStackJson.jobs.push(jobJsonObj);
        }
        jobIndex++;
    }
    fs.writeFileSync('storage/file-1.json', JSON.stringify(jobStackJson));
    return jobStackJson;
}

/**
 * Generate job stack type = tool
 * @param {*} worksheet 
 * @returns 
 */
const generateJobTypeTool = (worksheet) => {
    //get job stack name, type, line from excel sheet
    let jobStackName = getValueOfCell(worksheet, Constants.toolJson.name);
    let jobStackType = getValueOfCell(worksheet, Constants.machineJson.type);
    let jobStackLine = getValueOfCell(worksheet, Constants.toolJson.line);
    //define initial jobstack json object
    let jobStackJson = {
        "id": null,
        "name": jobStackName,
        "type": "tool",
        "line": jobStackLine,
        "jobs": []
    };
    //define job's information
    let jobIndex = 1, jobIRCS = true, jobNo = true, jobBrand, jobProduct, jobVolume, jobJsonObj;
    while (jobIRCS || jobNo) {
        //get job IRCS, Number, Brand, Product, Volume from excel sheet
        jobIRCS = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.ircs);
        jobNo = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.no);
        jobBrand = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.brand);
        jobProduct = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.product);
        jobVolume = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.volume);
        // Just handle row that has IRCS and number
        if (jobIRCS && jobNo) {
            // Define job json object with the first step instruction
            jobJsonObj = {
                "id": null,
                "version": "1.0",
                "isActive": true,
                "details": {
                    "brand": jobBrand,
                    "product": jobProduct,
                    "volume": jobVolume,
                    "ircs": jobIRCS.toString().replaceAllTxt(" ", "").split('-')
                },
                "steps": [
                    {
                        "id": null,
                        "version": "1.0",
                        "order": 0,
                        "isActive": true,
                        "type": "instructionText",
                        "title": `Outillage : ${jobStackName}`,
                        "instruction": "Rendez-vous à:",
                        "tool": "",
                        "timed": false,
                        "medias": [`/images/${jobStackLine}/${jobStackType}/${jobStackName}/localisation.png`],
                        "repere": "",
                        "zone": "",
                        "valStd": "",
                        "valCalc": "",
                        "stdTime": null
                    }
                ]
            };
            let stepOrder = 1,
                stepType,
                stepInstruction,
                stepTool,
                stepMediaPath,
                stepRepere,
                stepStdTime,
                stepJsonObj,
                stepIndex = 1;

            let listColumns = Constants.getExcelColumns();
            let startIndex = listColumns.indexOf('G');
            let endIndex = listColumns.indexOf('AG');
            //handle all tool step
            for (stepIndex = 1; stepIndex <= (endIndex - startIndex); stepIndex++) {
                stepType = null;
                stepInstruction = null;
                stepTool = null;
                stepMediaPath = null;
                stepRepere = null;
                stepStdTime = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).steps(stepIndex).stdTime);
                //just handle when has std time
                if (stepStdTime) {
                    //get step's information from excel sheet
                    stepInstruction = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).steps(stepIndex).instruction);
                    stepRepere = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).steps(stepIndex).repere);

                    stepType = "instructionText";
                    stepMediaPath = `/images/${jobStackLine}/${jobStackType}/${jobStackName}/Outillages/${stepRepere}.png`;
                    if (stepRepere && stepRepere.startsWith("zone")) {
                        //check if the step repere is start with zone
                        stepType = "location";
                    }
                    else if (fs.existsSync(path.join(process.cwd(), stepMediaPath))) {
                        //check if the image is existing in folder
                        stepType = 'instructionTextMediaValue';
                    }
                    else {
                        stepMediaPath = ''
                    }

                    //get step tool value
                    let orderEtapeRCO = true, indexEtapeRCO = 1;
                    while (orderEtapeRCO) {
                        orderEtapeRCO = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(indexEtapeRCO).order);
                        //just handle step is interger
                        if (Number.isInteger(orderEtapeRCO)) {
                            //if the selected tool is equal with step tool => stepTool is valstd
                            if (stepInstruction == getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(indexEtapeRCO).tool)) {
                                stepTool = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(indexEtapeRCO).valStd);
                                orderEtapeRCO = false;
                            }
                        }
                        indexEtapeRCO++;
                    }

                    //define step json object
                    stepJsonObj = {
                        "id": null,
                        "version": "1.0",
                        "order": stepOrder,
                        "isActive": true,
                        "type": stepType,
                        "title": jobStackName,
                        "instruction": stepInstruction,
                        "tool": stepTool,
                        "timed": true,
                        "medias": [stepMediaPath],
                        "repere": stepRepere,
                        "zone": "",
                        "valStd": "",
                        "valCalc": "",
                        "stdTime": stepStdTime
                    };
                    jobJsonObj.steps.push(stepJsonObj);
                    stepOrder++;
                }
            }
            jobStackJson.jobs.push(jobJsonObj);
        }
        jobIndex++;
    }
    fs.writeFileSync('storage/file-2.json', JSON.stringify(jobStackJson));
    return jobStackJson;
}

/**
 * Generate job stack type = logistic
 * @param {*} worksheet 
 * @returns 
 */
const generateJobTypeLogistic = (worksheet) => {
    //get job stack name, type, line from excel sheet
    let jobStackName = getValueOfCell(worksheet, Constants.logisticJson.name);
    let jobStackType = getValueOfCell(worksheet, Constants.logisticJson.type);
    let jobStackLine = getValueOfCell(worksheet, Constants.logisticJson.line);
    //define initial jobstack json object
    let jobStackJson = {
        "id": null,
        "name": jobStackName,
        "type": jobStackType,
        "line": jobStackLine,
        "jobs": []
    };
    // Define job json object with the first step instruction
    let jobJsonObj = {
        "id": null,
        "version": "1.0",
        "isActive": true,
        "steps": [
            {
                "id": null,
                "version": "1.0",
                "order": 0,
                "isActive": true,
                "type": "instructionText",
                "title": `Logistique : ${jobStackName}`,
                "instruction": "Rendez-vous à:",
                "tool": "",
                "timed": false,
                "medias": [`/images/${jobStackLine}/${jobStackType}/${jobStackName}/localisation.png`],
                "repere": "",
                "zone": "",
                "valStd": "",
                "valCalc": "",
                "stdTime": null
            }
        ]
    };
    let stepOrder = true,
        stepType,
        stepTitle,
        stepInstruction,
        stepMediaPath,
        stepRepere,
        stepStdTime,
        stepJsonObj,
        stepIndex = 1;
    //just handle column that have order
    while (stepOrder) {
        stepType = null;
        stepTitle = null;
        stepInstruction = null;
        stepMediaPath = null;
        stepRepere = null;
        stepStdTime = null;
        stepOrder = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).order);
        //just handle step is interger
        if (Number.isInteger(stepOrder)) {
            //get step's information from excel sheet
            stepTitle = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).title);
            stepInstruction = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).instruction);
            stepRepere = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).repere);
            stepStdTime = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).stdTime);
            //check if the image is existing in folder
            stepType = "instructionText";
            stepMediaPath = `/images/${jobStackLine}/${jobStackType}/${jobStackName}/${stepOrder}.png`;
            if (fs.existsSync(path.join(process.cwd(), stepMediaPath))) {
                stepType = 'instructionTextMediaValue';
            }
            else {
                stepMediaPath = '';
            }
            //define step json object
            stepJsonObj = {
                "id": null,
                "version": "1.0",
                "order": stepOrder,
                "isActive": true,
                "type": stepType,
                "title": stepTitle,
                "instruction": stepInstruction,
                "tool": null,
                "timed": true,
                "medias": [stepMediaPath],
                "repere": stepRepere,
                "zone": null,
                "valStd": null,
                "valCalc": null,
                "stdTime": stepStdTime || 300
            };
            jobJsonObj.steps.push(stepJsonObj)
        }
        stepIndex++;
    }
    jobStackJson.jobs.push(jobJsonObj);
    fs.writeFileSync('storage/file-3.json', JSON.stringify(jobStackJson));
    return jobStackJson;
}

/**
 * Extract excel file and save to db with job type = machine
 * @param {*} worksheet 
 */
const extractExcelForJobTypeMachine = async (worksheet) => {
    //get job stack name, type, line from excel sheet
    let jobStackName = getValueOfCell(worksheet, Constants.machineJson.name);
    let jobStackType = getValueOfCell(worksheet, Constants.machineJson.type);
    let jobStackLine = getValueOfCell(worksheet, Constants.machineJson.line);

    //define job's information
    let jobIndex = 1, jobIRCS = true, jobNo = true, jobBrand, jobProduct, jobVolume;
    while (jobIRCS || jobNo) {
        //get job IRCS, Number, Brand, Product, Volume from excel sheet
        jobIRCS = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.ircs);
        jobNo = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.no);
        jobBrand = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.brand);
        jobProduct = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.product);
        jobVolume = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).details.volume);

        // Just handle row that has IRCS and number
        if (jobIRCS && jobNo) {
            //retrive catalog Object from ircs, product, brand, volume
            let catalogObject = await retrieveCatalog(jobIRCS, jobProduct, jobBrand, jobVolume);
            //save the new job
            let jobCustomObj = await jobCustomSchema.insert({
                name: (jobStackName || '').toString(),
                line: (jobStackLine || '').toString(),
                type: (jobStackType || '').toString()
            });
            let job = await jobSchema.insert({
                customFields: jobCustomObj,
                version: "1.0",
                isActive: true,
                catalog: catalogObject
            });

            //insert first step
            let firstStep = await stepCustomSchema.insert({
                type: "location",
                title: `Localisation`,
                instruction: "Rendez-vous à:",
                tool: '',
                timed: false,
                medias: [`/images/${jobStackLine}/${jobStackType}/${jobStackName}/localisation.png`],
                repere: '',
                zone: '',
                valStd: '',
                valCalc: '',
                stdTime: null
            });
            await stepSchema.insert({
                customFields: firstStep,
                order: 0,
                isActive: true,
                version: "1.0",
                job: job
            });

            let stepOrder = true,
                stepType,
                stepTitle,
                stepInstruction,
                stepTool,
                stepMediaPath,
                stepRepere,
                stepZone,
                stepValStd,
                stepValCalc,
                stepStdTime,
                stepIndex = 1;
            //just handle column that have order
            while (stepOrder) {
                stepType = null;
                stepTitle = null;
                stepInstruction = null;
                stepTool = null;
                stepMediaPath = null;
                stepRepere = null;
                stepValStd = null;
                stepValCalc = null;
                stepStdTime = null;
                stepOrder = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).order);
                //just handle step is interger
                if (Number.isInteger(stepOrder)) {
                    //get step's information from excel sheet
                    stepInstruction = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).instruction);
                    if (!stepInstruction) {
                        //stop to process next step when instruction (Action) is empty
                        break;
                    }
                    stepTitle = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).title);
                    stepTool = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).tool);
                    stepRepere = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).repere);
                    stepValStd = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).valStd);
                    stepValCalc = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).valCalc);
                    stepStdTime = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).stdTime);
                    // If the current zone is different from the previous zone => add new instruction step
                    if (stepZone != getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).zone)) {
                        stepZone = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(stepIndex).zone);
                        //define step josn object for new zone
                        let newStepForNewZoneCustom = await stepCustomSchema.insert({
                            type: "location",
                            title: "Localisation",
                            instruction: "Rendez-vous à:",
                            tool: '',
                            timed: true,
                            medias: [`/images/${jobStackLine}/${jobStackType}/${jobStackName}/zone${stepZone}.png`],
                            repere: '',
                            zone: '',
                            valStd: '',
                            valCalc: '',
                            stdTime: null
                        });
                        await stepSchema.insert({
                            customFields: newStepForNewZoneCustom,
                            order: stepOrder - 0.5,
                            isActive: true,
                            version: "1.0",
                            job: job
                        });
                    }
                    //check if the image is existing in folder
                    stepMediaPath = `/images/${jobStackLine}/${jobStackType}/${jobStackName}/${stepOrder}.png`;
                    if (fs.existsSync(path.join(process.cwd(), stepMediaPath))) {
                        stepType = 'instructionTextMediaValue';
                    }
                    else {
                        stepMediaPath = "";
                    }
                    //define step json object
                    let newStepCustom = await stepCustomSchema.insert({
                        type: (stepType || '').toString(),
                        title: (stepTitle || '').toString(),
                        instruction: (stepInstruction || '').toString(),
                        tool: (stepTool || '').toString(),
                        timed: true,
                        medias: [stepMediaPath],
                        repere: (stepRepere || '').toString(),
                        zone: (stepZone || '').toString(),
                        valStd: (stepValStd || '').toString(),
                        valCalc: (stepValCalc || '').toString(),
                        stdTime: parseInt(stepStdTime || 300)
                    });
                    await stepSchema.insert({
                        customFields: newStepCustom,
                        order: stepOrder,
                        isActive: true,
                        version: "1.0",
                        job: job
                    });
                }
                stepIndex++;
            }
        }
        jobIndex++;
    }
}

/**
 * Extract excel file and save to db with job type = tool
 * @param {*} worksheet 
 * @returns 
 */
const extractExcelForJobTypeTool = async (worksheet) => {
    //get job stack name, type, line from excel sheet
    let jobStackName = getValueOfCell(worksheet, Constants.toolJson.name);
    let jobStackType = getValueOfCell(worksheet, Constants.machineJson.type);
    let jobStackLine = getValueOfCell(worksheet, Constants.toolJson.line);

    //define job's information
    let jobIndex = 1, jobIRCS = true, jobNo = true, jobBrand, jobProduct, jobVolume;
    while (jobIRCS || jobNo) {
        //get job IRCS, Number, Brand, Product, Volume from excel sheet
        jobIRCS = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.ircs);
        jobNo = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.no);
        jobBrand = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.brand);
        jobProduct = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.product);
        jobVolume = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).details.volume);

        // Just handle row that has IRCS and number
        if (jobIRCS && jobNo) {
            //retrive catalog Object from ircs, product, brand, volume
            let catalogObject = await retrieveCatalog(jobIRCS, jobProduct, jobBrand, jobVolume);
            //save the new job
            let jobCustomObj = await jobCustomSchema.insert({
                name: (jobStackName || '').toString(),
                line: (jobStackLine || '').toString(),
                type: "tool"
            });
            let job = await jobSchema.insert({
                customFields: jobCustomObj,
                version: "1.0",
                isActive: true,
                catalog: catalogObject
            });

            //insert first step
            let firstStep = await stepCustomSchema.insert({
                type: "instructionText",
                title: `Outillage : ${jobStackName}`,
                instruction: "Rendez-vous à:",
                tool: '',
                timed: false,
                medias: [`/images/${jobStackLine}/${jobStackType}/${jobStackName}/localisation.png`],
                repere: '',
                zone: '',
                valStd: '',
                valCalc: '',
                stdTime: null
            });
            await stepSchema.insert({
                customFields: firstStep,
                order: 0,
                isActive: true,
                version: "1.0",
                job: job
            });

            let stepOrder = 1,
                stepType,
                stepInstruction,
                stepTool,
                stepMediaPath,
                stepRepere,
                stepStdTime,
                stepIndex = 1;
            let listColumns = Constants.getExcelColumns();
            let startIndex = listColumns.indexOf('G');
            let endIndex = listColumns.indexOf('AG');
            //handle all tool step
            for (stepIndex = 1; stepIndex <= (endIndex - startIndex); stepIndex++) {
                stepType = null;
                stepInstruction = null;
                stepTool = null;
                stepMediaPath = null;
                stepRepere = null;
                stepStdTime = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).steps(stepIndex).stdTime);
                //just handle when has std time
                if (stepStdTime) {
                    //get step's information from excel sheet
                    stepInstruction = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).steps(stepIndex).instruction);
                    stepRepere = getValueOfCell(worksheet, Constants.toolJson.jobs(jobIndex).steps(stepIndex).repere);

                    stepType = "instructionText";
                    stepMediaPath = `/images/${jobStackLine}/${jobStackType}/${jobStackName}/Outillages/${stepRepere}.png`;
                    if (stepRepere && stepRepere.startsWith("zone")) {
                        //check if the step repere is start with zone
                        stepType = "location";
                    }
                    else if (fs.existsSync(path.join(process.cwd(), stepMediaPath))) {
                        //check if the image is existing in folder
                        stepType = 'instructionTextMediaValue';
                    }
                    else {
                        stepMediaPath = ''
                    }

                    //get step tool value
                    let orderEtapeRCO = true, indexEtapeRCO = 1;
                    while (orderEtapeRCO) {
                        orderEtapeRCO = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(indexEtapeRCO).order);
                        //just handle step is interger
                        if (Number.isInteger(orderEtapeRCO)) {
                            //if the selected tool is equal with step tool => stepTool is valstd
                            if (stepInstruction == getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(indexEtapeRCO).tool)) {
                                stepTool = getValueOfCell(worksheet, Constants.machineJson.jobs(jobIndex).steps(indexEtapeRCO).valStd);
                                orderEtapeRCO = false;
                            }
                        }
                        indexEtapeRCO++;
                    }

                    //define step json object
                    let newStepCustom = await stepCustomSchema.insert({
                        type: (stepType || '').toString(),
                        title: (jobStackName || '').toString(),
                        instruction: (stepInstruction || '').toString(),
                        tool: (stepTool || '').toString(),
                        timed: true,
                        medias: [stepMediaPath],
                        repere: (stepRepere || '').toString(),
                        zone: '',
                        valStd: '',
                        valCalc: '',
                        stdTime: parseInt(stepStdTime)
                    });
                    await stepSchema.insert({
                        customFields: newStepCustom,
                        order: stepOrder,
                        isActive: true,
                        version: "1.0",
                        job: job
                    });
                    stepOrder++;
                }
            }
        }
        jobIndex++;
    }
}

/**
 * Extract excel file and save to db with job type = logistic
 * @param {*} worksheet 
 * @returns 
 */
const extractExcelForJobTypeLogistic = async (worksheet) => {
    //get job stack name, type, line from excel sheet
    let jobStackName = getValueOfCell(worksheet, Constants.logisticJson.name);
    let jobStackType = getValueOfCell(worksheet, Constants.logisticJson.type);
    let jobStackLine = getValueOfCell(worksheet, Constants.logisticJson.line);

    //insert job to db
    let jobCustomObj = await jobCustomSchema.insert({
        name: (jobStackName || '').toString(),
        line: (jobStackLine || '').toString(),
        type: (jobStackType || '').toString()
    });
    let job = await jobSchema.insert({
        customFields: jobCustomObj,
        version: "1.0",
        isActive: true,
        catalog: null
    });

    //insert first step
    let firstStep = await stepCustomSchema.insert({
        type: "instructionText",
        title: `Logistique : ${jobStackName}`,
        instruction: "Rendez-vous à:",
        tool: '',
        timed: false,
        medias: [`/images/${jobStackLine}/${jobStackType}/${jobStackName}/localisation.png`],
        repere: '',
        zone: '',
        valStd: '',
        valCalc: '',
        stdTime: null
    });
    await stepSchema.insert({
        customFields: firstStep,
        order: 0,
        isActive: true,
        version: "1.0",
        job: job
    });

    let stepOrder = true,
        stepType,
        stepTitle,
        stepInstruction,
        stepMediaPath,
        stepRepere,
        stepStdTime,
        stepIndex = 1;
    //just handle column that have order
    while (stepOrder) {
        stepType = null;
        stepTitle = null;
        stepInstruction = null;
        stepMediaPath = null;
        stepRepere = null;
        stepStdTime = null;
        stepOrder = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).order);
        //just handle step is interger
        if (Number.isInteger(stepOrder)) {
            //get step's information from excel sheet
            stepInstruction = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).instruction);
            if (!stepInstruction) {
                //stop to process next step when instruction (Action) is empty
                break;
            }
            stepTitle = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).title);
            stepRepere = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).repere);
            stepStdTime = getValueOfCell(worksheet, Constants.logisticJson.steps(stepIndex).stdTime);
            //check if the image is existing in folder
            stepType = "instructionText";
            stepMediaPath = `/images/${jobStackLine}/${jobStackType}/${jobStackName}/${stepOrder}.png`;
            if (fs.existsSync(path.join(process.cwd(), stepMediaPath))) {
                stepType = 'instructionTextMediaValue';
            }
            else {
                stepMediaPath = '';
            }
            //define step json object
            let newStepCustom = await stepCustomSchema.insert({
                type: (stepType || '').toString(),
                title: (stepTitle || '').toString(),
                instruction: (stepInstruction || '').toString(),
                tool: '',
                timed: true,
                medias: [stepMediaPath],
                repere: (stepRepere || '').toString(),
                zone: '',
                valStd: '',
                valCalc: '',
                stdTime: parseInt(stepStdTime || 300)
            });
            await stepSchema.insert({
                customFields: newStepCustom,
                order: stepOrder,
                isActive: true,
                version: "1.0",
                job: job
            });
        }
        stepIndex++;
    }
}

exports.readCSVFile = async (req, res, next) => {
    try {
        let result = {};
        const workbook = new Excel.Workbook();
        let excelFile = await workbook.xlsx.readFile(req.body.file.path);
        let matrixParams = excelFile.getWorksheet(process.env.MATRIX_PARAMETERS);
        let matrixActions = excelFile.getWorksheet(process.env.MATRIX_ACTIONS);
        if (matrixParams) {
            await extractExcelForJobTypeMachine(matrixParams);
            await extractExcelForJobTypeTool(matrixParams);
        }
        else if (matrixActions) {
            await extractExcelForJobTypeLogistic(matrixActions);
        }
        res.status(200).json({ success: true, data: result });
    }
    catch (err) {
        next({
            status: 500,
            message: "Bad Request! " + err
        });
    }
}