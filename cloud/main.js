Parse.Cloud.define("test", async (request) => {
	// Create a new instance of that class.
});

Parse.Cloud.define("createProject", async (request) => {
	const Project = Parse.Object.extend("Project");
	const Stack = Parse.Object.extend("Stack");
	const project = new Project();
	const stackNumber = 5;
	const query = new Parse.Query("Project");
	var stacks = [];
	var response = {
		success:true,
		data:[]
	};
	var stacks_response = {
		stacks:[]
	};

	project.set("user", request.params.user);
	const proj = await	project.save();
	const object = await query.get(proj.id);
	//start formating the response by adding the project object and preparing the stacks
	response.data.push(object);
	response.data.push(stacks_response);

	//for each of the stack, create a stack Object and assign its project Pointer
	for (let i = 0; i < stackNumber; i++) {
		stacks[i] = new Stack();
		stacks[i].set("project",object);
		stacks[i].set("order",i);
		const res = await	stacks[i].save();
		//add the jobstack id replied by the server in the response message
		response.data[1].stacks.push({objectId:res.id});
	}
	//console.log(JSON.stringify(message_response,null,2));
		return response;
});


Parse.Cloud.define("deleteProject", async (request) => {
	const projectID = request.params.projectID;
	const query = new Parse.Query("Project");
	const response = {};
	const project = await query.get(projectID);

	await project.destroy().then((project) => {
	  // The object was deleted from the Parse Cloud.
	}, (error) => {
	  // The delete failed.
	  // error is a Parse.Error with an error code and message.
	});
	response.success = true;
	return response;

});

Parse.Cloud.define("getScanSuccess", async (request) => {
	const stackID = request.params.stackID;
	const query = new Parse.Query("Stack");
	const response = {};
	const scanSuccess = await query.get(stackID).then((stack) => {
  	const devices = stack.get("devices");
		//if there is a device return true or else false.
		return (devices ? true : false)
	}, (error) => {
  	console.log("error " + error);
	});
	response.success = true;
	response.scanSuccess = scanSuccess;
	//console.log("scanSuccess " + scanSuccess + "  message " + response);
	return response;

});

Parse.Cloud.define("setProject", async (request) => {
  //const projectID = request.params.projectID;
  //const nameOT = request.params.nameOT;
  const projectOrder = request.params.projectOrder;
  const catalogCustomQuery = new Parse.Query("CatalogCustom");
  const projectQuery = new Parse.Query("Project");
  const stackQuery = new Parse.Query("Stack");
  const jobQuery = new Parse.Query("Job");
  const stepQuery = new Parse.Query("Step");
  const stackJobQuery = new Parse.Query("StackJob");
  const StackJob = Parse.Object.extend("StackJob");
  const StackStep = Parse.Object.extend("StackStep");
  const stacks = projectOrder.project.jobStacks;

  //setup project line, irc, brand product volume.
  const catalogCustomObject = await catalogCustomQuery.equalTo("ircs", projectOrder.project.details.irc).find();
  const projectObject = await projectQuery.get(projectOrder.project.id);
  projectObject.set("irc", parseInt(projectOrder.project.details.irc));
  projectObject.set("line", projectOrder.project.details.ligne);
  projectObject.set("user", projectOrder.project.managerName);
  projectObject.set("brand", catalogCustomObject[0].get("brand"));
  projectObject.set("product", catalogCustomObject[0].get("product"));
  projectObject.set("volume", catalogCustomObject[0].get("volume"));
  await projectObject.save();

  //creating response message skeleton
  const response = {
    project: {
      id: projectObject.id,
      jobStacks: []
    }
  };

  //looping through all stacks to create and associate new StackJob
  for (let i = 0; i < stacks.length; i++) {
    const stackObject = await stackQuery.get(stacks[i].id);

    //formating response with proper URL for the QRcodes
    response.project.jobStacks.push({
      id: stackObject.id,
      order: stackObject.get("order"),
      urlQRcode: "http://augmenteeddemo1.ddns.net:1337/parse/functions/scanStack?stackID=" + stackObject.id
    });

    const jobs = stacks[i].jobs;
    //looping through all jobs in the stack to create new StackJob
    for (let j = 0; j < jobs.length; j++) {
      const jobObject = await jobQuery.get(jobs[j].id);
      const curStackJob = new StackJob();
      curStackJob.set("job", jobObject);
      curStackJob.set("order", jobs[j].order);
      curStackJob.set("stack", stackObject);
      const retStackJob = await curStackJob.save();
      //searching all steps Pointing to the current jobObject
      const stepResults = await stepQuery.equalTo("job", jobObject).find();

      //looping through all steps in the job stack to create new StackStep for each result in stepResults
      for (let k = 0; k < stepResults.length; k++) {
        const curStackStep = new StackStep();
        const stackJobObject = await stackJobQuery.get(retStackJob.id);
        curStackStep.set("step", stepResults[k]);
        curStackStep.set("stackJob", stackJobObject);
        await curStackStep.save();
      }
    }
  }
  return response;
});

Parse.Cloud.define("scanStack", async (request) => {
	const projectID = request.params.stackID;
	const nameOT = request.params.deviceID;

	//retrieve stack with stack ID and set stack.device with the stackID.

	//query to get all StackJobs and StackSteps assigend to the StackJob

	//retuns list of jobs and steps
});
