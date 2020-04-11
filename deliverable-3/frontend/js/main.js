'use strict';
const log = console.log;


function licensePlateAddition() {
	document.getElementById("license-plate-add").addEventListener("click", (e) => {addLicensePlates(e);});
}

function replaceNavbarItems(){
	const entireNavBar = document.getElementsByClassName("navbar navbar-expand-lg navbar-dark bg-dark fixed-top")[0];

	const newNavItem = document.createElement('nav-item');
	const settingsItem = document.createElement('a');
	settingsItem.className = "nav-link";
	settingsItem.href = "../html/settings.html";
	settingsItem.text = "Settings";

	const navStats = document.createElement('nav-item');
	const statsItem = document.createElement('a');
	statsItem.className = "nav-link";
	statsItem.href = "../html/user_statistics.html";
	statsItem.text = "Statistics";
	
	document.querySelectorAll('.nav-item').forEach(function(a){
		if(!(a.children[0].className.includes("nav-link logout-btn"))){
			a.remove()
		}
	});
	navStats.appendChild(statsItem);
	entireNavBar.appendChild(navStats);

	newNavItem.appendChild(settingsItem);
	entireNavBar.appendChild(newNavItem);
}

function replaceBackButton(){
	const entireNavBar = document.getElementsByClassName("navbar navbar-expand-lg navbar-dark bg-dark fixed-top")[0]

	const newNavItem = document.createElement('nav-item')
	const settingsItem = document.createElement('a')
	settingsItem.className = "nav-link"
	settingsItem.onclick = toDashboard
	settingsItem.text = "Back"
	settingsItem.style.color = "white";

	document.querySelectorAll('.nav-item').forEach(function(a){
		a.remove()
	})

	newNavItem.appendChild(settingsItem)
	entireNavBar.appendChild(newNavItem)
}

function updateLPs(){
	// {accountNum: int, firstPlate: string, secondPlate: string}
	const firstLPN = document.getElementById('account-lpn').value
	const secondLPN = document.getElementById('account-lpn2').value

	fetch('/get-cookie').then(res => {
		return res.json()
	}).then(resp => {
		const newLPs = {
			accountNum: parseInt(resp.userData.accountNum),
			firstPlate: firstLPN,
			secondPlate: secondLPN,
		};

		const newUserReq = new Request('/update-lp', {
			method: "post",
			body: JSON.stringify(newLPs),
			headers: {
            'Accept': 'application/json, text/plain, /',
            'Content-Type': 'application/json'
        	}
		});

		return fetch(newUserReq).then(res => {
			if (res.status !== 200){
				alert("An error occurred with updating the details! Error code: " + res.status.toString())
				return Promise.reject(1)
			} else {
				console.log("The response of the sign-up is: ", res)
				return Promise.resolve(0)
			}
		}).catch(err => {
			console.log(err)
			alert("An error ocurred with updating the details! Error Code: " + err)
			return Promise.reject(1)
		})

	})
}

function updatePersonalDetails(){
	// {accountNum: int, newFirst: string, newLast: string, newPhone: int, newEmail: string}
	const firstName = document.getElementById("account-fn").value
	const lastName = document.getElementById("account-ln").value
	const phoneNum = document.getElementById("account-phone").value
	const email = document.getElementById("account-email").value

	const password = document.getElementById("account-pass").value
	const confirmPassword = document.getElementById("account-confirm-pass").value

	fetch('/get-cookie').then(res => {
		return res.json()
	}).then(resp => {
		const newUserData = {
			accountNum: parseInt(resp.userData.accountNum),
			newFirst: firstName,
			newLast: lastName,
			newPhone: parseInt(phoneNum),
			newEmail: email
		};

		const newUserReq = new Request('/update-account-details', {
			method: "post",
			body: JSON.stringify(newUserData),
			headers: {
            'Accept': 'application/json, text/plain, /',
            'Content-Type': 'application/json'
        	}
		});

		return fetch(newUserReq).then(res => {
			if (res.status !== 200){
				alert("An error occurred with updating the details! Error code: " + res.status.toString())
				return Promise.reject(1)
			} else {
				console.log("The response of the sign-up is: ", res)
				if(password !== "" && confirmPassword !== "" && password === confirmPassword){
					updatePassword()
				}
				return Promise.resolve(0)
			}
		}).catch(err => {
			console.log(err)
			alert("An error ocurred with updating the details! Error Code: " + err)
			return Promise.reject(1)
		})


	})

}

function updatePassword(){
	const password = document.getElementById("account-pass").value
	const confirmPassword = document.getElementById("account-confirm-pass").value

	fetch('/update-pw/' + password).then(res => {
		return res.json()
	}).then(resp => {
		console.log("Password Successfully Changed!")
	})
}

function toDashboard(){
	window.location.href = '/dashboard'
}

function obtainPersonalInfo(e){
	console.log("obtaining personal info....")
	replaceBackButton()

	fetch("/get-cookie")
	.then(res => {
		return res.json()
	}).then(res => {
		console.log("ACCOUNT TYPE IS " + res.userData.acctType)
		const url = '/search-acct-num/' + res.userData.accountNum
		fetch(url).then(res => {
			return res.json();
		}).then(resp => {
			populatePersonalInfo(resp)
		})
	}).catch((err) => {
		console.log(err)
	})

}

function populateUserInfo(userInfo){
	console.log("reached popualteUserIfo")
	console.log(userInfo)
	const firstLicensePlate = document.getElementById("account-lpn")
	firstLicensePlate.value = userInfo[0].license_num;
	const secondLicensePlate = document.getElementById("account-lpn2")
	if (userInfo.length > 1){
		secondLicensePlate.value = userInfo[1].license_num;
	} else {
		secondLicensePlate.value = ""
	}

	console.log(userInfo[0].license_num)

}

function populatePersonalInfo(personalInfo){
	const firstName = document.getElementById("account-fn")
	firstName.value = personalInfo.first_name;
	const displayName = document.getElementsByClassName("author-card-details")
	displayName[0].children[0].innerText = personalInfo.first_name + " " + personalInfo.last_name;
	const lastName = document.getElementById("account-ln")
	lastName.value = personalInfo.last_name;
	const email = document.getElementById("account-email")
	email.value = personalInfo.email;
	const phone = document.getElementById("account-phone")
	phone.value = personalInfo.phone_num;
}

function logout(e){
	fetch('/logout').then(res=>{
		if (res.status !== 200) {console.log("Logout unsuccessful");} 
		else {
			console.log("Logout Successful");
			window.location.href = '/'
        }
    })
}

function addNewDriver(e){

	addNewUser("user").then((result) => {
		window.location.href = '/enter-lp-nums';
	}).catch((err) => {
		alert(`An error occurred with driver signup: ${err}`);

	});
}

function addNewPLM(e){
	addNewUser("plm").then((result) => {
		window.location.href = '/enter-lot-data';
	}).catch((err) => {
		alert(`An error occurred with parking lot manager signup: ${err}`);

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
};

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
};

function scorePassword(pass) {
    var score = 0;
    if (!pass)
        return score;

    // award every unique letter until 5 repetitions
    var letters = {};
    for (var i=0; i<pass.length; i++) {
        letters[pass[i]] = (letters[pass[i]] || 0) + 1;
        score += 5.0 / letters[pass[i]];
    }

    // bonus points for mixing it up
    var variations = {
        digits: /\d/.test(pass),
        lower: /[a-z]/.test(pass),
        upper: /[A-Z]/.test(pass),
        nonWords: /\W/.test(pass),
    };

    var variationCount = 0;
    for (var check in variations) {
        variationCount += (variations[check] == true) ? 1 : 0;
    }
    score += (variationCount - 1) * 10;

    return parseInt(score);
}

function checkPassStrength(score) {
    if (score >= 75)
        return "Strong";
    if (score >= 50)
        return "Good";
    if (score >= 25)
        return "Weak";
    else
        return "Very Weak";

}

function reportPasswordStrength() {
    const password = document.getElementById("exampleInputPassword1").value.trim();
    const passwordScore = scorePassword(password);
    document.getElementById('strengthBar').innerHTML = checkPassStrength(passwordScore);
    const dict = {75: "progress-bar bg-success", 50: "progress-bar bg-info",
    25: "progress-bar bg-warning", 0: "progress-bar bg-danger"};
    const nums = [0,25,50,75];
    for (var i=0; i<4;i++) {
        if (passwordScore >= nums[i])
            document.getElementById('strengthBar').className = dict[nums[i]];
    }
}


function redirectUserPLMsettings(){
	fetch("/get-cookie")
	.then(res => {
		return res.json()
	}).then(res => {
		if(res.userData.acctType == "user"){
			window.location.href = '/user-settings-page';
		} else {
			window.location.href = '/plm-settings-page';
		}
	}).catch((err) => {
		console.log(err)
	})

}

function redirectSettingsPage(){
	window.location.href = '/settings-page'
}

function obtainUserInfo(){
	console.log("reached the obtainUserInfo() function")
	replaceName()
	replaceBackButton()
	fetch("/get-cookie")
	.then(res => {
		return res.json()
	}).then(res => {
		const url = '/get-license-plate/' + res.userData.accountNum
		fetch(url).then(res => {
			return res.json()
		}).then(resp => {
			populateUserInfo(resp)
		})
	}).catch((err) => {
		console.log(err)
	})

}


function replaceName(){
	fetch('/get-cookie').then(res => {
		return res.json()
	}).then(resp => {
		const url = '/search-acct-num/' + resp.userData.accountNum
		console.log(url)
		fetch(url).then(pi => {
			return pi.json()
		}).then(personalInfo => {
			const displayName = document.getElementsByClassName("author-card-details")
			displayName[0].children[0].innerText = personalInfo.first_name + " " + personalInfo.last_name;
		})
	}).catch(err => {
		console.log("Error Occurred! With replaceName()  Error: " + err)
	})
}

function obtainPLMInfo(){
	replaceBackButton()
	fetch('/get-cookie').then(res => {
		//console.dir(res.json)
		return res.json()

	}).then(res => {
		const newUrl = '/get-parking-lot-id/' + res.userData.accountNum
		console.log(newUrl)
		fetch(newUrl).then(res => {
			return res.json()
		}).then(res => {
			console.log(res[0])
			if (! res[0].lot_id){
				console.log(res.lot_id + "ya")
				handlenolots()
			}
			else{
			console.log("res.lot_name is ")
			console.log(res.lot_name)
			const lotName = document.getElementById("account-lotname")
			lotName.value = res[0].lot_name
			const address = document.getElementById("account-address")
			address.value = res[0].address
			const capacity = document.getElementById("account-capacity")
			capacity.value = res[0].capacity
			const type = document.getElementById("account-type")
			type.value = res[0].type
			const restrictions = document.getElementById("account-restrictions")
			restrictions.value = res[0].restriction
			const descriptions = document.getElementById("account-description")
			descriptions.value = res[0].description
			}
		})
	})

}
function handlenolots(){
	console.log("here")
	var header = document.getElementById("plmsettingsheader")
	header.innerHTML = "You have no lots, add one here:"
	var button = document.getElementById("updateplmbtn")
	button.innerText = "add lot"
	button.onclick = addParkingLot

	var lotName = document.getElementById("account-lotname")
	lotName.id = "lotName"
	var address = document.getElementById("account-address")
	address.id = "address"
	var capacity = document.getElementById("account-capacity")
	capacity.id = "capacity"
	var type = document.getElementById("account-type")
	type.id = "type"
	var restrictions = document.getElementById("account-restrictions")
	restrictions.id = "restrictions"
	var descriptions = document.getElementById("account-description")
	descriptions.id = "description"



}

function updatePLMsettings(){

	fetch('/get-cookie').then(res => {
		return res.json()
	}).then(resp => {
		const newUrl = '/get-parking-lot-id/' + resp.userData.accountNum
		fetch(newUrl).then(res => {
			return res.json()
		}).then(resp => {

			const lotName = document.getElementById("account-lotname")
			const address = document.getElementById("account-address")
			const capacity = document.getElementById("account-capacity")
			const type = document.getElementById("account-type")
			const restrictions = document.getElementById("account-restrictions")
			const descriptions = document.getElementById("account-description")

			console.log("lot id is" + resp[0].lot_id)
			const newUserData = {
				lotID: resp[0].lot_id,
				newCapacity: capacity.value,
				newRestriction: restrictions.value,
				newDescription: descriptions.value,
				newName: lotName.value
			};

			const url = '/update-pl'
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
					log("The response is: ", res);
					return Promise.resolve(0);
				}

			}).catch(err => {
				console.log(err);
				alert("An error occured with adding the user! Error code: " + err);
				return Promise.reject(1);
			})

		})
	})

}




// function obtainPLMInfo(){
// 	console.log("reached the obtainUserInfo() function")
// replaceBackButton()

// 	fetch("/get-cookie")
// 	.then(res => {
// 		return res.json()
// 	}).then(res => {
// 		console.log(res)
// 		const url = '/get-plm-info/' //+ res.userData.accountNum
// 		fetch(url).then(res => {
// 			return res.json();
// 		}).then(resp => {
// 			populatePLMinfo(resp)
// 		})
// 	}).catch((err) => {
// 		console.log(err)
// 	})
// }


function validateEmail(email) {
	const re = /\S+@\S+\.\S+/;
	return re.test(email);
}

function addNewUser(userType){

	const url = "/new-user";
	
	//const firstName = document.getElementsByClassName("form-control")[0].value;
	const firstName = document.getElementById("firstName").value.trim();
	//const lastName = document.getElementsByClassName("form-control")[1].value;
	const lastName = document.getElementById("lastName").value.trim(); 
	//const email = document.getElementsByClassName("form-control")[2].value;
	const email = document.getElementById("email").value.trim(); 
	//const phoneNumber = document.getElementsByClassName("form-control")[3].value;
	const phoneNumber = document.getElementById("phone").value.trim(); 
	//const password = document.getElementsByClassName("form-control")[4].value;
	const password = document.getElementById("exampleInputPassword1").value.trim();
	const confirmPassword = document.getElementById("exampleInputPassword2").value.trim();

	if (firstName === "" || lastName === "" || email === "" || phoneNumber === "" || password === ""){
		alert("Please fill in both fields and try again, thanks!");
		return Promise.reject(1);
	}

	if (!validateEmail(email)) {
		alert("Email is invalid! Try again.");
		return Promise.reject(1)
	}

	if (parseInt(phoneNumber) < 0){
		alert("You may not use a negative phone number!")
		return Promise.reject(1)
	}

	if (email.indexOf("TEMPORARY_ACCOUNT") > -1){
		alert("You may not use a temporary account email!")
		return Promise.reject(1)
	}

	if(password !== confirmPassword){
		alert("Passwords do not match!");
		return Promise.reject(1)
	}

	console.log("Adding new user...");

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
	let timePassedIn = "2004-10-19T14:53:54.000Z"; // the format of the input MUST be this
	// console.log("time passed in is : " + date.value);
	var newD = new Date(timePassedIn);
	var tempArray = date.toString().split("T");
	tempArray[1] = tempArray[1].replace("000Z", "");
	return tempArray
}
function trim(s){
  return ( s || '' ).replace( /^\s+|\s+$/g, '' );
}

function addLicensePlates(e){
	console.log("Adding License Plates...");
	fetch("/get-cookie")
	.then(res => {
		return res.json();
	})
	.then(res => {
		//const licensePlateOne = document.getElementsByClassName("form-control")[0].value;
		const licensePlateOne = document.getElementById("lpNum1").value.trim(); 
		//const licensePlateTwo = document.getElementsByClassName("form-control")[1].value;
		const licensePlateTwo = document.getElementById("lpNum2").value.trim(); 
		
		const enteredSecondLP = (licensePlateTwo !== "");
		console.log(res);
		const license_plate_data = {
			twoPlates: enteredSecondLP,
			plate: licensePlateOne,
			plateTwo: licensePlateTwo,
			acctNum: res.userData.accountNum
		};
		const licensePlateRequest = new Request('/add-license-plate', {
			method: "post", 
			body: JSON.stringify(license_plate_data), 
			headers: {
				"Accept": "application/json, text/plain, */*",
				"Content-Type": "application/json"
			}
		});
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
}
function logout(e){
	console.log("Logging out...");
	const url = '/logout';
	fetch(url).then(res => {
		if(res.status !== 200){
			console.log(`An error occurred: Response was ${res.status}`); 
			return {} 
		} else {
			console.log("Log Out Successful");
			window.location.href = '/';
		}
	}).catch(err => {
		console.log("Error Occurred: " + err)
	})
}

function obtainTransactions() {
	console.log("Obtaining Transactions...");
	// make a fetch request to get the cookie first to get the user's email address 
	let userEmail = "";
	let acctType = "";
	let cookieUrl = "/get-cookie";
	let urlEmail = "";
	let urlTransactions = "";
	let accountNum;
	return fetch(cookieUrl)

		.then(res => {
			if (res.status !== 200) {
				console.log("An error occurred in obtaining the cookie: Response was not 200");
				return {}
			} else {
				return res.json()
			}
		})
		.then(result => {
			if (result !== {}) {
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
			if (accountNum !== null) {
				urlTransactions = '/get-user-transactions/' + accountNum.account_num;
				return fetch(urlTransactions);
			} else {
				return null;
			}
		})
		.then(res => {
			console.log("Got here");
			console.log(res);
			return res.json();
		})
		.catch(err => {
		console.log("Error Occurred: " + err)
	});
}

function generateStats() {
	let transactions = obtainTransactions();
	transactions.then(res => {
		console.log("Got transactions");
		let num = showNumTransactions(res);
		let total = showTotalSpend(res);
		showAvgSpend(total, num);
		let lotStats = getLotStats(res);
		showTimeParked(res);
		console.log("Got All stats")
	})
	.catch(error => {
		console.log(`Error in the promise encountered! Error was the following; ${error}`)
	})
}

function showTimeParked(transactions) {
	let time = 0;
	let longestTime = 0;
	for (let i = 0; i < transactions.length; i++) {
		let timeEntered = new Date(transactions[i]["time_entered"]);
		let timeExited = new Date(transactions[i]["time_exited"]);
		console.log(timeEntered);
		console.log(timeExited);
		let curTime = (timeExited - timeEntered)/1000./3600.;
		time += curTime;
		if (curTime > longestTime) {
		    longestTime = curTime;
        }
	}
	let avgTime = (time/transactions.length).toFixed(1);
	console.log(avgTime);
    document.getElementById('timeParked').innerHTML = String(avgTime) + " hours";
    document.getElementById('longestTimeParked').innerHTML = String(longestTime.toFixed(1)) + " hours";
	return [avgTime, longestTime]
}

function showTransactionHistory() {
	let transactions = obtainTransactions();
	transactions.then(res => {
		populateTable(res);
		console.log("Got transactions")
	})
	.catch(error => {
		console.log(`Error in the promise encountered! Error was the following; ${error}`)
	})
}

function showNumTransactions(transactions) {
	document.getElementById('numTransactions').innerHTML = String(transactions.length);
	return transactions.length
}

function showTotalSpend(transactions) {
	let numEntries = transactions.length;
	let totalCost = 0;
	for (let i = 0; i < numEntries; i++) {
		totalCost += parseFloat(transactions[i]["cost"])
	}
	console.log(totalCost);
	console.log("Got total amount");
	document.getElementById('totalSpend').innerHTML = "$"+String(totalCost);
	return totalCost;
}

function showAvgSpend(totalSpend, numTransactions) {
	let avgSpend = totalSpend/numTransactions;
	document.getElementById('avgSpend').innerHTML = "$"+String(avgSpend);
	return avgSpend;
}

function getLotStats(transactions) {
	let numEntries = transactions.length;
	let uniqueLots = 0;
	let mostFreqLot = "";
	let freq = {};
	let count = 0;
	for (let i = 0; i < numEntries; i++) {
		if (!(transactions[i]["lot_id"] in freq)) {
			freq[transactions[i]["lot_id"]] = 1;
			uniqueLots += 1;
		}
		else {
			freq[transactions[i]["lot_id"]] += 1;
		}
	}
	for (var key in freq) {
		if (freq[key] > count) {
			count = freq[key];
			mostFreqLot = key;
		}
	}
	document.getElementById('lotsVisited').innerHTML = String(uniqueLots);
	// document.getElementById('mostFreq').innerHTML = String(mostFreqLot);
	return [mostFreqLot, uniqueLots];
}

function redirectStatsPage() {
	fetch('/get-cookie')
	.then( res =>{
		return res.json()
	})
	.then(res => {
		// console.log(res.userData);
	if (res.userData.acctType == "user") {
		window.location.href = '../html/stats_user.html';
	} else {
		window.location.href = '../html/stats_plm.html'
	}
	}).catch( (err) => {
		console.log(err)
	})

}


function addParkingLot(e){
	console.log("Adding new parking lot..");
	fetch("/get-cookie").then(resp => {
		return resp.json() 
	}).then(res => {
		console.log(res);
		//const lotName = document.getElementsByClassName("form-control")[0].value;
		const lotName = document.getElementById("lotName").value.trim();
		//const address = document.getElementsByClassName("form-control")[1].value;
		const address = document.getElementById("address").value.trim(); 
		//const capacity = Number(document.getElementsByClassName("form-control")[2].value);
		const capacity = document.getElementById("capacity").value.trim();
		//const type = document.getElementsByClassName("form-control")[3].value;
		const type = document.getElementById("type").value.trim(); 
		//const restriction = document.getElementsByClassName("form-control")[4].value;
		const restriction = document.getElementById("restrictions").value.trim(); 
		//const description = document.getElementsByClassName("form-control")[5].value;
		const description = document.getElementById("description").value.trim();

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
		};
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
			});
			log("The parking lot request is: ", parkingLotRequest);
			return fetch(parkingLotRequest)
		}).then((res) => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error); 
				alert(res.body.error);
			} else {
				window.location.href = '/pricing-timeslot'
			}
		})
		.catch(err => {
			console.log("Error Occurred: " + err)
		})

}

function obtainPLMTransactions(e){
	console.log("Obtaining PLM Transactions...");

	// make a fetch request to get the cookie first to get the user's email 
	let cookieUrl = "/get-cookie";
	let urlEmail = "";
	let urlParkingLotId = "";
	let urlPLMTransactions = "";

	fetch(cookieUrl).then(res => {
		if(res.status !== 200){
			console.log("An error occurred in obtaining the cookie: Response was not 200");
			return {} 
		} else {
			return res.json() 
		}
	}).then(result => {
		if(result !== {}){
			urlEmail = "/search-email/" + result.userData.email;
			return fetch(urlEmail)
		} else {
			return null; 
		}
	}).then(result => {
		return result.json() 
	}).then(accountNum => {
		if(accountNum !== null){
			urlParkingLotId = "/get-parking-lot-id/" + accountNum.account_num;
			return fetch(urlParkingLotId)
		} else {
			return null
		}
	}).then(res => {
		return res.json() 
	}).then(resp => {
		if(resp !== null){
			urlPLMTransactions = '/get-plm-transactions/' + resp[0].parking_lot_id
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

function populateTable(transactions){
	// this function, when complete, will accept the JSON object obtained from the /obtaintransactions route and 
	// populate the table on the front end with that data 

	var numEntries = transactions.length;
		
	if(numEntries > 0){
		// CREATE DYNAMIC TABLE AND SET ATTRIBUTES.
		var table = document.createElement("table");
		table.classList.add("table");
		table.classList.add("table-bordered");
		table.classList.add("table-striped");
		table.style.width = '100%';
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
		const regex = "([0-9]{4})-([0-9]{2})";

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

function weekendRates(e){
	window.location.href = '/weekend-rates';
}

function longtermRates(e){
	window.location.href = '/longterm-rates';
}

function specialRates(e){
	window.location.href = '/special-rates';
}

function addPricing(e){
	window.location.href = '/dashboard';
}

function addTimeslot(e){
	let dayTime = document.getElementById("day-time").value;
	let eveningTime = document.getElementById("evening-time").value;

	dayTime = dayTime + ":00";
	eveningTime = eveningTime + ":00";

	console.log("day time: " + dayTime)
	console.log("evening time: " + eveningTime)

	const timeslot = {
		day: dayTime,
		evening: eveningTime
	};

	console.dir(timeslot);

	const timeslotRequest = new Request('/set-timeslot-cookie', {
		method: "post",
		body: JSON.stringify(timeslot),
		headers: {
			"Accept": "application/json, text/plain, */*",
			"Content-Type": "application/json"
		}
	});

	fetch(timeslotRequest).then(res => {
		if (res.status !== 200) {
			console.log("Error: " + res.body.error);
			alert(res.body.error);
		} else {
			window.location.href = '/pricing-main'
		}

	}).catch(error => {
		console.log("Error occured: " + error);
	})

}

function addWeekdayRate(e)
{

	console.log("Adding new weekday rate..");
	fetch("/get-cookie").then(resp => {
		return resp.json() 
	}).then(res => {
		let dayTime = res.timeslotCookie.day;
		let eveningTime = res.timeslotCookie.evening;
		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum);
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res[0].lot_id);
			const mon = document.getElementsByClassName("form-checkbox")[0].checked;
			const tue = document.getElementsByClassName("form-checkbox")[1].checked;
			const wed = document.getElementsByClassName("form-checkbox")[2].checked;
			const thu = document.getElementsByClassName("form-checkbox")[3].checked;
			const fri = document.getElementsByClassName("form-checkbox")[4].checked;

			console.log("The value of Friday: " + fri);
	
			const timeLength = Number(document.getElementById("time-length").value);
			const cost = Number(document.getElementById("cost").value);

			const isDay = document.getElementById("day").checked;
			const isEvening = document.getElementById("evening").checked;

			let startTime;
			let endTime;

			if (isDay)
			{
				startTime = dayTime;
				endTime = eveningTime;
			}
			else if (isEvening)
			{
				startTime = eveningTime;
				endTime = dayTime;
			}

			console.log("The value of start time: " + startTime);
			console.log("The value of start time: " + endTime);

			if (timeLength <= 0 || cost <= 0){
				alert("Please make sure time length and cost are positive integers");
				return;
			}

			const newWeekdayRate = {
				type: 1,
				params:{
					lot_id: res[0].lot_id,
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
			};

			console.dir(newWeekdayRate);

			const weekdayRequest = new Request('/add-parking-rate', {
				method: "post", 
				body: JSON.stringify(newWeekdayRate), 
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			});
			log("The weekday rate request is: ", weekdayRequest);
			return fetch(weekdayRequest)
		}).then((res) => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error); 
				alert(res.body.error);
			} else {
				window.location.href = '/pricing-main'
			}

		}).catch(error => {
			console.log("Error occured: " + error);
		})
	}).catch(error => {
		console.log("Error occured: " + error);
	})

}

function addWeekendRate(e)
{

	console.log("Adding new weekend rate..");
	fetch("/get-cookie").then(resp => {
		return resp.json()
	}).then(res => {
		let dayTime = res.timeslotCookie.day;
		let eveningTime = res.timeslotCookie.evening;
		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum);
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res[0].lot_id);
			const sat = document.getElementsByClassName("form-checkbox")[0].checked;
			const sun = document.getElementsByClassName("form-checkbox")[1].checked;

			const timeLength = Number(document.getElementById("time-length").value);
			const cost = Number(document.getElementById("cost").value);

			const isDay = document.getElementById("day").checked;
			const isEvening = document.getElementById("evening").checked;

			let startTime;
			let endTime;

			if (isDay)
			{
				startTime = dayTime;
				endTime = eveningTime;
			}
			else if (isEvening)
			{
				startTime = eveningTime;
				endTime = dayTime;
			}

			console.log("The value of start time: " + startTime);

			if (timeLength <= 0 || cost <= 0){
				alert("Please make sure time length and cost are positive integers");
				return;
			}

			const newWeekendRate = {
				type: 2,
				params:{
					lot_id: res[0].lot_id,
					sat: sat,
					sun: sun,
					time_length: timeLength,
					cost: cost,
					start_time: startTime,
					end_time: endTime
				}
			};

			console.dir(newWeekendRate);

			const weekendRequest = new Request('/add-parking-rate', {
				method: "post",
				body: JSON.stringify(newWeekendRate),
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			});
			log("The weekend rate request is: ", weekendRequest);
			return fetch(weekendRequest)
		}).then((res) => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error);
				alert(res.body.error);
			} else {
				window.location.href = '/pricing-main'
			}

		}).catch(error => {
			console.log("Error occured: " + error);
		})
	}).catch(error => {
		console.log("Error occured: " + error);
	})

}

function addLongtermRate(e)
{

	console.log("Adding new longterm rate..");
	fetch("/get-cookie").then(resp => {
		return resp.json()
	}).then(res => {

		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum);
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res[0].lot_id);
			const isMonthly = document.getElementById("monthly").checked;
			const isYearly = document.getElementById("yearly").checked;
			let dayLength;

			if (isMonthly)
			{
				dayLength = -30;
			}
			else if (isYearly)
			{
				dayLength = -365;
			}

			console.log("Day length is: " + dayLength)

			const cost = Number(document.getElementById("cost").value);

			if (cost <= 0){
				alert("Please make sure cost is a positive integer");
				return;
			}

			const newLongtermRate = {
				type: 3,
				params:{
					lot_id: res[0].lot_id,
					day_length: dayLength,
					cost: cost
				}
			};

			console.dir(newLongtermRate);

			const longtermRequest = new Request('/add-parking-rate', {
				method: "post",
				body: JSON.stringify(newLongtermRate),
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			});
			log("The longterm rate request is: ", longtermRequest);
			return fetch(longtermRequest)
		}).then((res) => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error);
				alert(res.body.error);
			} else {
				window.location.href = '/pricing-main'
			}

		}).catch(error => {
			console.log("Error occured: " + error);
		})
	}).catch(error => {
		console.log("Error occured: " + error);
	})

}

function addSpecialRate(e)
{

	console.log("Adding new special rate..");
	fetch("/get-cookie").then(resp => {
		return resp.json()
	}).then(res => {
		let dayTime = res.timeslotCookie.day;
		let eveningTime = res.timeslotCookie.evening;
		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum);
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res[0].lot_id);
			const date = document.getElementById("special-day").value;

			console.log("Date is: " + date)

			const timeLength = Number(document.getElementById("time-length").value);
			const cost = Number(document.getElementById("cost").value);

			const isDay = document.getElementById("day").checked;
			const isEvening = document.getElementById("evening").checked;

			let startTime;
			let endTime;

			if (isDay)
			{
				startTime = dayTime;
				endTime = eveningTime;
			}
			else if (isEvening)
			{
				startTime = eveningTime;
				endTime = dayTime;
			}

			console.log("The value of start time: " + startTime);

			if (timeLength <= 0 || cost <= 0){
				alert("Please make sure time length and cost are positive integers");
				return;
			}

			const newSpecialRate = {
				type: 4,
				params:{
					lot_id: res[0].lot_id,
					day: date,
					time_length: timeLength,
					cost: cost,
					start_time: startTime,
					end_time: endTime
				}
			};

			console.dir(newSpecialRate);

			const specialRequest = new Request('/add-parking-rate', {
				method: "post",
				body: JSON.stringify(newSpecialRate),
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			});
			log("The special rate request is: ", specialRequest);
			return fetch(specialRequest)
		}).then((res) => {
			if (res.status !== 200) {
				console.log("Error: " + res.body.error);
				alert(res.body.error);
			} else {
				window.location.href = '/pricing-main'
			}

		}).catch(error => {
			console.log("Error occured: " + error);
		})
	}).catch(error => {
		console.log("Error occured: " + error);
	})

}


function checkEnter(e) {
    //See notes about 'which' and 'key'
    if (e && e.keyCode == 13) {
        authenticate();
    }
}

// This function will invoke the authentication route in the backend
function authenticate(e){
	console.log("Authenticating...");
	document.getElementById("loginbtn").disabled= true;
	const url = "/authenticate";

	const emailEntered = document.getElementsByClassName("form-control")[0].value;
	console.log("Email entered is: " + emailEntered);

	const passwordEntered = document.getElementsByClassName("form-control")[1].value;
	console.log("Password entered is: " + passwordEntered);

	if (emailEntered === "" || passwordEntered === ""){
		document.getElementById("loginbtn").disabled= false;
		var curErrors = document.getElementById("errormessage");
		if (curErrors){
			curErrors.remove();
		}
		var elm = document.createElement('div');
		elm.id = "errormessage";
		elm.innerHTML = "Please fill in both fields and try again, thanks!";
		document.getElementById("loginform").appendChild(elm);

		return;
	}

	const userData = {
		user: {
			email: emailEntered, 
			password: passwordEntered
		}
	};

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
	.then(result => {
		document.getElementById("loginbtn").disabled= false;
		var curErrors = document.getElementById("errormessage");
		if (curErrors){
			curErrors.remove();
		}
		var elm = document.createElement('div');
		elm.id = "errormessage";
		elm.innerHTML = result.error;
		document.getElementById("loginform").appendChild(elm);})
	.catch(error => console.log(error));
	
}
