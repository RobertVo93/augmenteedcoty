exports.getValueOfCell = (worksheet, cell) => {
	let cellObj = worksheet.getCell(cell);
	let result = cellObj.result;
	if (result == null) {
		result = cellObj.value;
	}
	if (typeof (result) == "string" || typeof (result) == "number") {
		return result;
	}
	else {
		return null;
	}
}