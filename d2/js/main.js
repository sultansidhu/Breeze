'use strict'
const log = console.log


function licensePlateAddition() {
	document.getElementById("license-plate-add").addEventListener("click", (e) => {addLicensePlates(e);});
}

function logout(e){
	fetch('/logout').then(res=>{
		if (res.status !== 200) {console.log("Logout unsuccessful");} 
		else {
			console.log("Logout Successful");
			window.location.href = '/'
		};
	})
}

function addNewDriver(e){
	addNewUser("user").then((result) => {
		window.location.href = '/enter-lp-nums';
	}).catch((err) => {
		alert(`An error occurred with driver signup: ${err}`);
		return;
	});
}

function addNewPLM(e){
	addNewUser("plm").then((result) => {
		window.location.href = '/enter-lot-data';
	}).catch((err) => {
		alert(`An error occurred with parking lot manager signup: ${err}`);
		return;
	})
}

const addRadioButtonListeners = () => {
	/**
	 * This function add listeners to the radio buttons so that we show/hide the 'other' text box properly
	 */
	const radios = document.forms["parking-lot-form"].elements["lotType"];
	document.getElementById('type').style.display = 'none';
	document.getElementById('typeLabel').style.display = 'none';
	log("radios is: ", radios);
	for(var i = 0, max = radios.length; i < max; i++) {
		radios[i].onclick = function() {
			let displaySetting;
			log("This dot value is ", this.value);
			if (this.value != 'other' && this.value != ''){
				displaySetting = 'none';
			}
			else{
				displaySetting = 'block';
			}
			document.getElementById('type').style.display = displaySetting;
			document.getElementById('typeLabel').style.display = displaySetting;
		}
	}
}

const findSelectedOptions = () => {
	/**
	 * This function finds which option(s) were chosen for the given form, and returns a list containing
	 *  the values of such buttons.
	 */
	log("Reached the find selected options");
	const radios = document.forms["parking-lot-form"].elements["lotType"];
	log("Reached the find selected options 2");
	const output = [];
	for (let i = 0; i < radios.length; i++){
		log("Radios i is: ", radios[i]);
		if (radios[i].checked){
			//alert("The radio that was checked is: ", radios[i].value);
			output.push(radios[i].value);
		}
	}
	return output;
}

function addNewUser(userType){

	console.log("Adding new user...");
	const url = "/new-user"
	
	const firstName = document.getElementsByClassName("form-control")[0].value;
	const lastName = document.getElementsByClassName("form-control")[1].value;
	const email = document.getElementsByClassName("form-control")[2].value;
	const phoneNumber = document.getElementsByClassName("form-control")[3].value;
	const password = document.getElementsByClassName("form-control")[4].value;

	if (firstName === "" || lastName === "" || email === "" || phoneNumber === "" || password === ""){
		alert("Please fill in both fields and try again, thanks!");
		return Promise.reject(1);
	}

	const newUserData = {
		newUser:{
			email: email, 
			password: password, 
			firstName: firstName, 
			lastName: lastName, 
			phoneNum: phoneNumber, 
			accountType: userType
		}
	};

	const newUserReq = new Request(url, {
		method: "post", 
		body:JSON.stringify(newUserData), 
		headers: {
            'Accept': 'application/json, text/plain, /',
            'Content-Type': 'application/json'
        }
	});

	return fetch(newUserReq).then(res => {
		if (res.status !== 200){
			alert("An error occured with adding the user! Error code: " + res.status.toString());
			return Promise.reject(1);
		}
		else{
			log("The response of the sign-up is: ", res);
			return Promise.resolve(0);
		}
		
	}).catch(err => {
		console.log(err);
		alert("An error occured with adding the user! Error code: " + err);
		return Promise.reject(1);
	})
}


function reformatDate(date){
	console.log("im in ")
	let timePassedIn = "2004-10-19T14:53:54.000Z" // the format of the input MUST be this 
	console.log("time passed in is : " + date.value)
	var newD = new Date(timePassedIn)
	var tempArray = newD.toString().split(" ") 
	let newString = "" 
  
	for(let i = 0; i<5;i++){
		newString += tempArray[i] + " "  
	}
	
	return newString 
}

function addLicensePlates(e){
	console.log("Adding License Plates...");
	fetch("/get-cookie")
	.then(res => {
		return res.json();
	})
	.then(res => {
		const licensePlateOne = document.getElementsByClassName("form-control")[0].value;
		const licensePlateTwo = document.getElementsByClassName("form-control")[1].value;
		const enteredSecondLP = (licensePlateTwo !== "");
		console.log(res);
		const license_plate_data = {
			twoPlates: enteredSecondLP,
			plate: licensePlateOne,
			plateTwo: licensePlateTwo,
			acctNum: res.userData.accountNum
		}
		const licensePlateRequest = new Request('/add-license-plate', {
			method: "post", 
			body: JSON.stringify(license_plate_data), 
			headers: {
				"Accept": "application/json, text/plain, */*",
				"Content-Type": "application/json"
			}
		})
		fetch(licensePlateRequest).then(res => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error); 
				alert("An error occurred; please try again");
			}
			else {
				window.location.href = '/dashboard';
			}
			
		}).catch(error => {
			console.log(error);
		});
	});
};



function logout(e){
	console.log("Logging out...")
	const url = '/logout'
	fetch(url).then(res => {
		if(res.status !== 200){
			console.log(`An error occurred: Response was ${res.status}`); 
			return {} 
		} else {
			console.log("Log Out Successful")
			window.location.href = '/';
		}
	}).catch(err => {
		console.log("Error Occurred: " + err)
	})
}

function obtainTransactions(e){
	console.log("Obtaining Transactions...")
	// make a fetch request to get the cookie first to get the user's email address 
	let userEmail = "";
	let acctType = "";
	let cookieUrl = "/get-cookie";
	let urlEmail = "";
	let urlTransactions = "";
	let accountNum;
	fetch(cookieUrl)
	
	.then(res => {
		if (res.status !== 200){
			console.log("An error occurred in obtaining the cookie: Response was not 200");
			return {}
		} else {
			return res.json()
		} 
	})
	.then(result => {
		if (result !== {}){
			urlEmail = "/search-email/" + result.userData.email;
			return fetch(urlEmail)
		} else {
			return null;
		}
	})
	.then(result => {
		return result.json()

	})
	.then(accountNum => {
		if (accountNum !== null){
			urlTransactions = '/get-user-transactions/' + accountNum.account_num;
			return fetch(urlTransactions);
		} else {return null;}
	})
	.then(res => {
		return res.json()
		
	}).then(response => {
		if (response !== null){
			populateTable(response)
		}
	})
	.catch(error => {
		console.log(`Error in the promise encountered! Error was the following; ${error}`)
	});
}

function addParkingLot(e){
	console.log("Adding new parking lot..")
	fetch("/get-cookie").then(resp => {
		return resp.json() 
	}).then(res => {
		console.log(res);
		const lotName = document.getElementsByClassName("form-control")[0].value;
		const address = document.getElementsByClassName("form-control")[1].value;
		const capacity = Number(document.getElementsByClassName("form-control")[2].value);
		const type = document.getElementsByClassName("form-control")[3].value;
		const restriction = document.getElementsByClassName("form-control")[4].value;
		const description = document.getElementsByClassName("form-control")[5].value;

		if (lotName == '' || address  == '' || capacity <= 0 || restriction == '' || description == ''){
			alert("Please fill in all fields, and make sure that capacity is a positive integer");
			return;
		}
		log("type is: ", type);
		const newParkingLotData = {
			parkingLotInfo:{
				lotName: lotName, 
				address: address, 
				capacity: capacity, 
				type: type, 
				restriction: restriction, 
				description: description
			}, 
			accountNum: res.userData.accountNum
		}
		return [newParkingLotData, findSelectedOptions(), type];
		}).then((returnVal) => {
			log("The selected options are: ", returnVal[1]);
			log("Return val 0 is ", returnVal[0]);
			if(returnVal[1][0] != 'other'){
				returnVal[0].parkingLotInfo.type = returnVal[1][0];
			}
			log("Return val 0 is ", returnVal[0].parkingLotInfo.type);
			return returnVal[0];
		}).then((parkingLotData1) => {
			const parkingLotRequest = new Request('/add-parking-lot', {
				method: "post", 
				body: JSON.stringify(parkingLotData1), 
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			})
			log("The parking lot request is: ", parkingLotRequest)
			return fetch(parkingLotRequest)
		}).then((res) => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error); 
				alert(res.body.error);
			} else {
				alert("About to redirect");
				window.location.href = '/pricing-main'
			}
		})
		.catch(err => {
			console.log("Error Occurred: " + err);
		})
		/*
		fetch(parkingLotRequest).then(res => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error); 
				alert(res.body.error);
			} else {
				alert("About to redirect");
				window.location.href = '/dashboard'
			}
			
		})
		*/
	



	// .then(res => {
	// 	const lotName = document.getElementsByClassName("form-control")[0].value;
	// 	const address = document.getElementsByClassName("form-control")[1].value;
	// 	const capacity = document.getElementsByClassName("form-control")[2].value;
	// 	const type = document.getElementsByClassName("form-control")[3].value;
	// 	const restriction = document.getElementsByClassName("form-control")[4].value;
	// 	const description = document.getElementsByClassName("form-control")[5].value;
	// 	const newParkingLotData = {
	// 		parkingLotInfo:{
	// 			lotName: lotName, 
	// 			address: address, 
	// 			capacity: capacity, 
	// 			type: type, 
	// 			restriction: restriction, 
	// 			description: description
	// 		},
	// 		accountNum: res.userData.accountNum
	// 	}
	// 	const parkingLotRequest = new Request('/add-parking-lot', {
	// 		method: "post", 
	// 		body: JSON.stringify(newParkingLotData), 
	// 		headers: {
	// 			"Accept": "application/json, text/plain, */*",
	// 			"Content-Type": "application/json"
	// 		}
	// 	})
	// 	fetch(parkingLotRequest).then(res => {
	// 		if (res.status !== 200) {
	// 			console.log("Error: " + res.body.error); 
	// 			alert(res.body.error);
	// 		} else {
	// 			window.location.href = '/dashboard'
	// 		}
			
	// 	}).catch(error => {
	// 		console.log(error);
	// 		alert(error);
	// 	});
	// });
}

// function addParkingLot(e){
// 	// final version of addParkingLot please disregard other versions
// 	console.log("Adding new parking lot..")
// 	fetch("/get-cookie")
// 	.then(res => {
// 		const lotName = document.getElementsByClassName("form-control")[0].value;
// 		const address = document.getElementsByClassName("form-control")[1].value;
// 		const capacity = document.getElementsByClassName("form-control")[2].value;
// 		const type = document.getElementsByClassName("form-control")[3].value;
// 		const restriction = document.getElementsByClassName("form-control")[4].value;
// 		const description = document.getElementsByClassName("form-control")[5].value;


// 		if (lotName == '' || address  == '' || capacity <= 0 || restriction == '' || description == ''){
// 			alert("Please fill in all fields, and make sure that capacity is a positive integer");
// 			return;
// 		}
// 		log("type is: ", type);
// 		log("res is ", res);
// 		const newParkingLotData = {
// 			parkingLotInfo:{
// 				lotName: lotName, 
// 				address: address, 
// 				capacity: capacity, 
// 				type: type, 
// 				restriction: restriction, 
// 				description: description
// 			},
// 			accountNum: res.userData.accountNum
// 		}
// 		return [newParkingLotData, findSelectedOptions(), type];
// 		}).then((returnVal) => {
// 			log("The selected options are: ", returnVal[1]);
// 			log("Return val 0 is ", returnVal[0]);
// 			if(returnVal[1][0] != 'other'){
// 				returnVal[0].parkingLotInfo.type = returnVal[1][0];
// 			}
// 			log("Return val 0 is ", returnVal[0].parkingLotInfo.type);
// 			return returnVal[0];
// 		}).then((parkingLotData1) => {
// 			const parkingLotRequest = new Request('/add-parking-lot', {
// 				method: "post", 
// 				body: JSON.stringify(parkingLotData1), 
// 				headers: {
// 					"Accept": "application/json, text/plain, */*",
// 					"Content-Type": "application/json"
// 				}
// 			})
// 			log("The parking lot request is: ", parkingLotRequest)
// 			return fetch(parkingLotRequest)
// 		}).then((res) => {
// 			if (res.status !== 200) {
// 				console.log("Error: " + res.body.error); 
// 				alert(res.body.error);
// 			} else {
// 				alert("About to redirect");
// 				window.location.href = '/dashboard'
// 			}
// 		})
// 		.catch(err => {
// 			console.log("Error Occurred: " + err)
// 		})
// 		/*
// 		fetch(parkingLotRequest).then(res => {
// 			if (res.status !== 200) {
// 				console.log("Error: " + res.body.error);
// 			}
			
// 		}).catch(error => {
// 			console.log(error);
// 		});
// 	});

// 				alert(res.body.error);
// 			} else {
// 				alert("About to redirect");
// 				window.location.href = '/dashboard'
// 			}
			
// 		})
// 		*/
	



// 	// .then(res => {
// 	// 	const lotName = document.getElementsByClassName("form-control")[0].value;
// 	// 	const address = document.getElementsByClassName("form-control")[1].value;
// 	// 	const capacity = document.getElementsByClassName("form-control")[2].value;
// 	// 	const type = document.getElementsByClassName("form-control")[3].value;
// 	// 	const restriction = document.getElementsByClassName("form-control")[4].value;
// 	// 	const description = document.getElementsByClassName("form-control")[5].value;
// 	// 	const newParkingLotData = {
// 	// 		parkingLotInfo:{
// 	// 			lotName: lotName, 
// 	// 			address: address, 
// 	// 			capacity: capacity, 
// 	// 			type: type, 
// 	// 			restriction: restriction, 
// 	// 			description: description
// 	// 		},
// 	// 		accountNum: res.userData.accountNum
// 	// 	}
// 	// 	const parkingLotRequest = new Request('/add-parking-lot', {
// 	// 		method: "post", 
// 	// 		body: JSON.stringify(newParkingLotData), 
// 	// 		headers: {
// 	// 			"Accept": "application/json, text/plain, */*",
// 	// 			"Content-Type": "application/json"
// 	// 		}
// 	// 	})
// 	// 	fetch(parkingLotRequest).then(res => {
// 	// 		if (res.status !== 200) {
// 	// 			console.log("Error: " + res.body.error); 
// 	// 			alert(res.body.error);
// 	// 		} else {
// 	// 			window.location.href = '/dashboard'
// 	// 		}
			
// 	// 	}).catch(error => {
// 	// 		console.log(error);
// 	// 		alert(error);
// 	// 	});
// 	// });

// }

function obtainPLMTransactions(e){
	console.log("Obtaining PLM Transactions...")

	// make a fetch request to get the cookie first to get the user's email 
	let cookieUrl = "/get-cookie"
	let urlEmail = "" 
	let urlParkingLotId = "" 
	let urlPLMTransactions = "" 

	fetch(cookieUrl).then(res => {
		if(res.status !== 200){
			console.log("An error occurred in obtaining the cookie: Response was not 200")
			return {} 
		} else {
			return res.json() 
		}
	}).then(result => {
		if(result !== {}){
			urlEmail = "/search-email/" + result.userData.email 
			return fetch(urlEmail)
		} else {
			return null; 
		}
	}).then(result => {
		return result.json() 
	}).then(accountNum => {
		if(accountNum !== null){
			urlParkingLotId = "/get-parking-lot-id/" + accountNum.account_num 
			return fetch(urlParkingLotId)
		} else {
			return null
		}
	}).then(res => {
		return res.json() 
	}).then(resp => {
		if(resp !== null){
			urlPLMTransactions = '/get-plm-transactions/' + resp.parking_lot_id 
			return fetch(urlPLMTransactions)
		}
	}).then(resp => {
		return resp.json() 
	}).then(response => {
		if(response !== null){
			populateTable(response)
		}
	}).catch(err => {
		console.log("Error Occurred: " + err)
	})
}

function weekdayRates(e){
	window.location.href = '/weekday-rates';
}

function addWeekdayRate(e)
{

	console.log("Adding new weekday rate..")
	fetch("/get-cookie").then(resp => {
		return resp.json() 
	}).then(res => {

		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum)
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res.lot_id);
			const mon = document.getElementsByClassName("form-checkbox")[0].checked;
			const tue = document.getElementsByClassName("form-checkbox")[1].checked;
			const wed = document.getElementsByClassName("form-checkbox")[2].checked;
			const thu = document.getElementsByClassName("form-checkbox")[3].checked;
			const fri = document.getElementsByClassName("form-checkbox")[4].checked;

			console.log("The value of Friday: " + fri);
	
			const timeLength = Number(document.getElementById("time-length").value);
			const cost = Number(document.getElementById("cost").value);
	
			let startTime = document.getElementById("start-time").value;
			let endTime = document.getElementById("end-time").value;

			startTime = startTime + ":00";
			endTime = endTime + ":00";

			console.log("The value of start time: " + startTime)
	
			if (timeLength <= 0 || cost <= 0){
				alert("Please make sure time length and cost are positive integers");
				return;
			}

			const newWeekdayRate = {
				type: 1,
				params:{
					lot_id: res.lot_id, 
					mon: mon, 
					tues: tue, 
					wed: wed, 
					thurs: thu, 
					fri: fri,
					time_length: timeLength,
					cost: cost,
					start_time: startTime,
					end_time: endTime
				}
			}

			console.dir(newWeekdayRate)

			const weekdayRequest = new Request('/add-parking-rate', {
				method: "post", 
				body: JSON.stringify(newWeekdayRate), 
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			})
			log("The weekday rate request is: ", weekdayRequest)
			return fetch(weekdayRequest)
		}).then((res) => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error); 
				alert(res.body.error);
			} else {
				alert("About to redirect");
				window.location.href = '/pricing-main'
			}

		}).catch(error => {
			console.log("Error occured: " + error);
		})
	}).catch(error => {
		console.log("Error occured: " + error);
	})

}


function addPricing(e){
	window.location.href = '/dashboard';
}

function populateTable(transactions){
	console.log("Reached populateTable() function")
	// this function, when complete, will accept the JSON object obtained from the /obtaintransactions route and 
	// populate the table on the front end with that data 

	var numEntries = transactions.length;
		
	if(numEntries > 0){
		// CREATE DYNAMIC TABLE AND SET ATTRIBUTES.
		var table = document.createElement("table");
		table.classList.add("table");
		table.classList.add("table-bordered");
		table.classList.add("table-striped");

		table.style.width = '50%';
		table.setAttribute('border', '1');
		table.setAttribute('cellspacing', '0');
		table.setAttribute('cellpadding', '5');

		// retrieve column header ('Name', 'Email', and 'Mobile')
		var col = []; // define an empty array
		for (var i = 0; i < numEntries; i++) {
			for (var key in transactions[i]) {
				if (col.indexOf(key) === -1) {
					col.push(key);
				}
			}
		}
		// CREATE TABLE HEAD .
		var tHead = document.createElement("thead");	
	

		// CREATE ROW FOR TABLE HEAD .
		var hRow = document.createElement("tr");
		
		// ADD COLUMN HEADER TO ROW OF TABLE HEAD.
		for (var i = 0; i < col.length; i++) {
				var th = document.createElement("th");
				th.innerHTML = col[i];
				hRow.appendChild(th);
		}
		tHead.appendChild(hRow);
		table.appendChild(tHead);		
		
		// CREATE TABLE BODY .
		var tBody = document.createElement("tbody");	
			
		// ADD COLUMN HEADER TO ROW OF TABLE HEAD.
		const regex = "([0-9]{4})-([0-9]{2})"

		for (var i = 0; i < numEntries; i++) {
		
				var bRow = document.createElement("tr"); // CREATE ROW FOR EACH RECORD .
				
				
				for (var j = 0; j < col.length; j++) {
					var td = document.createElement("td");
					console.log(JSON.stringify(transactions[i][col[j]]).substring(1,8));
					if(JSON.stringify(transactions[i][col[j]]).substring(0,8).match(regex)){
						td.innerHTML = reformatDate(transactions[i][col[j]])
					} else {
						td.innerHTML = transactions[i][col[j]];
					}

					bRow.appendChild(td);
				}
				tBody.appendChild(bRow)
		}
		table.appendChild(tBody);
		
		// FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
		var divContainer = document.getElementById("dynamicTable");
		divContainer.innerHTML = "";
		divContainer.appendChild(table);
	}
	else {
		console.log("Array empty");
	}

}

function weekdayRates(e){
	window.location.href = '/weekday-rates';
}

function addPricing(e){
	window.location.href = '/dashboard';
}

function addWeekdayRate(e)
{

	console.log("Adding new weekday rate..")
	fetch("/get-cookie").then(resp => {
		return resp.json() 
	}).then(res => {

		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum)
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res.lot_id);
			const mon = document.getElementsByClassName("form-checkbox")[0].checked;
			const tue = document.getElementsByClassName("form-checkbox")[1].checked;
			const wed = document.getElementsByClassName("form-checkbox")[2].checked;
			const thu = document.getElementsByClassName("form-checkbox")[3].checked;
			const fri = document.getElementsByClassName("form-checkbox")[4].checked;

			console.log("The value of Friday: " + fri);
	
			const timeLength = Number(document.getElementById("time-length").value);
			const cost = Number(document.getElementById("cost").value);
	
			let startTime = document.getElementById("start-time").value;
			let endTime = document.getElementById("end-time").value;

			startTime = startTime + ":00";
			endTime = endTime + ":00";

			console.log("The value of start time: " + startTime)
	
			if (timeLength <= 0 || cost <= 0){
				alert("Please make sure time length and cost are positive integers");
				return;
			}

			const newWeekdayRate = {
				type: 1,
				params:{
					lot_id: res.lot_id, 
					mon: mon, 
					tues: tue, 
					wed: wed, 
					thurs: thu, 
					fri: fri,
					time_length: timeLength,
					cost: cost,
					start_time: startTime,
					end_time: endTime
				}
			}

			console.dir(newWeekdayRate)

			const weekdayRequest = new Request('/add-parking-rate', {
				method: "post", 
				body: JSON.stringify(newWeekdayRate), 
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			})
			log("The weekday rate request is: ", weekdayRequest)
			return fetch(weekdayRequest)
		}).then((res) => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error); 
				alert(res.body.error);
			} else {
				alert("About to redirect");
				window.location.href = '/pricing-main'
			}

		}).catch(error => {
			console.log("Error occured: " + error);
		})
	}).catch(error => {
		console.log("Error occured: " + error);
	})


}

// This function will invoke the authentication route in the backend 
function authenticate(e){
	console.log("Authenticating...")
	const url = "/authenticate"

	const emailEntered = document.getElementsByClassName("form-control")[0].value;
	//console.log("Email entered is: " + emailEntered) 

	const passwordEntered = document.getElementsByClassName("form-control")[1].value;
	//console.log("Password entered is: " + passwordEntered) 

	if (emailEntered === "" || passwordEntered === ""){
		alert("Please fill in both fields and try again, thanks!");
		return;
	}

	const userData = {
		user: {
			email: emailEntered, 
			password: passwordEntered
		}
	}

	const authRequest = new Request(url, {
		method:"post",
		body: JSON.stringify(userData),
		headers: {
            'Accept': 'application/json, text/plain, /',
            'Content-Type': 'application/json'
        }
	});
	
	fetch(authRequest).then(res => {
		if (res.status !== 200) {
			return res.json();

		}
		window.location.href = '/dashboard'
	})
	.then(result => {alert(`Error: ${result.error}`);return;})
	.catch(error => console.log(error));
}

