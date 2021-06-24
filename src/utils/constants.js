exports.Constants = {
    getExcelColumns: () => {
        var i3, i4;
        var results = [];

        for (i3 = 0; i3 < 26; i3++) {
            results.push(String.fromCharCode(97 + i3).toUpperCase());
        }
        for (i3 = 0; i3 < 26; i3++) {
            for (i4 = 0; i4 < 26; i4++) {
                results.push(String.fromCharCode(97 + i3).toUpperCase() + String.fromCharCode(97 + i4).toUpperCase());
            }
        }
        return results;
    },
    jobType: {
        machine: "Machine",
        logistic: "Action logistique"
    },
    jobNoStart: 24,
    machineJson: {
        name: "B14",
        type: "A14",
        line: "B13",
        jobs: (jobNo) => {
            let index = this.Constants.jobNoStart + jobNo - 1;
            return {
                details: {
                    brand: `D${index}`,
                    product: `E${index}`,
                    volume: `F${index}`,
                    ircs: `C${index}`,
                    no: `B${index}`
                },
                steps: (stepNo) => {
                    let listColumns = this.Constants.getExcelColumns();
                    let stepColumn = listColumns[listColumns.indexOf('AH') + stepNo];
                    let valCalcColumn = listColumns[listColumns.indexOf('AH') + stepNo + 1];
                    return {
                        order: `${stepColumn}13`,
                        title: `${stepColumn}20`,
                        instruction: `${stepColumn}14`,
                        tool: `${stepColumn}22`,
                        repere: `${stepColumn}20`,
                        zone: `${stepColumn}21`,
                        valStd: `${stepColumn}${index}`,
                        valCalc: `${valCalcColumn}${index}`,
                        stdTime: `${stepColumn}11`,
                    };
                }
            }
        }
    },
    toolJson: {
        name: "B14",
        line: "B13",
        jobs: (jobNo) => {
            let index = this.Constants.jobNoStart + jobNo - 1;
            return {
                details: {
                    brand: `D${index}`,
                    product: `E${index}`,
                    volume: `F${index}`,
                    ircs: `C${index}`,
                    no: `B${index}`
                },
                steps: (stepNo) => {
                    let listColumns = this.Constants.getExcelColumns();
                    let stepColumn = listColumns[listColumns.indexOf('G') + stepNo];
                    return {
                        instruction: `${stepColumn}5`,
                        repere: `${stepColumn}10`,
                        stdTime: `${stepColumn}11`,
                        tool: `${stepColumn}22`,
                        valStd: `${stepColumn}${index}`
                    };
                }
            }
        }
    },
    logisticJson: {
        name: "B14",
        type: "A14",
        line: "B13",
        steps: (stepNo) => {
            let listColumns = this.Constants.getExcelColumns();
            let stepColumn = listColumns[listColumns.indexOf('AH') + stepNo];
            return {
                order: `${stepColumn}13`,
                title: `B14`,
                instruction: `${stepColumn}14`,
                repere: `${stepColumn}20`,
                stdTime: `${stepColumn}11`,
            };
        }
    },
    DBSchema: {
        job: "Job",
        jobCustom: "JobCustom",
        catalog: "Catalog",
        catalogCustom: "CatalogCustom",
        step: "Step",
        stepCustom: "StepCustom",
        project: "Project",
        stack: "Stack",
        stackJob: "StackJob",
        stackStep: "StackStep"
    }
}