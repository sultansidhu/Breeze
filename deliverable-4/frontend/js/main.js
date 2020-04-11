'use strict';
const log = console.log;


function licensePlateAddition() {
	/*
	This function adds an event listener to add license plates 
	*/
	document.getElementById("license-plate-add").addEventListener("click", (e) => { addLicensePlates(e); });
}

function redirectBanForm() {
	/*
	This function simply redirects the user to the ban-form.html page by submitting a GET request to 
	the /ban-form route on the server 
	*/
	window.location.href = '/ban-form'
}

function displayAdmin(e) {
	console.log("Admin logged in!")
}

function resolvePLReq(e) {
	const reqID = parseInt(document.getElementById("plReqInput").value);
	console.log(reqID)
	document.getElementById("plReqInput").value = "";
	fetch('/get-req-by-reqid/' + reqID.toString())
		.then(request => {
			console.log(request)
			return request.json();
		})
		.then(request => {
			console.log(request);
			const newReq = new Request('/resolve-add-lot-req', {
				method: "post",
				body: JSON.stringify({ "request": request }),
				headers: {
					'Accept': 'application/json, text/plain, /',
					'Content-Type': 'application/json'
				}
			});
			return fetch(newReq);
		})
		.then(res => {
			console.log(res)
			if (res.status == 200) {
				alert("Parking lot added!")
				location.reload();
			} else {
				alert("Unsuccessful. Error: ", res);
			}
		})
		.catch(error => alert("An error occurred. Error: ", error));
}

function resolveBanRequest(e) {
	const reqID = parseInt(document.getElementById("banReqInput").value);
	console.log(reqID)
	document.getElementById("banReqInput").value = "";
	fetch('/get-req-by-reqid/' + reqID.toString())
		.then(request => {

			console.log("THe request object before request.json is ", request)
			return request.json();
		})
		.then(request => {
			console.log("The request object after request.json is ", request);
			const newReq = new Request('/approve-ban-req', {
				method: "post",
				body: JSON.stringify({ "request": request }),
				headers: {
					'Accept': 'application/json, text/plain, /',
					'Content-Type': 'application/json'
				}
			});
			return fetch(newReq);
		})
		.then(res => {

			console.log("THe result of the ban action is ", res);
			if (res.status == 200) {
				alert("Ban successful!");
				location.reload();
			}
			else if (res.status == 400) {
				alert("The user you have tried to ban is already banned!");
			}
			else {
				alert("There was an error when banning a user; please contact a member of Breeze to report this bug!");
			}

		})
		.catch((error) => {
			console.log("An error occurred when trying to ban a user: ", error);
			alert("An error occurred. Error: ", error)
		});
};

function submitBanRequest(e) {
	/*
	This function extracts the user-entered text on the input and submits a subsequent ban request 
	to ban a user, by submitting a GET request to the /ban-user/:accountNum route on the server 
	*/
	const banEmail = document.getElementById("ban-email").value.trim()
	const banPhone = document.getElementById("ban-phone").value.trim()

	console.log("banning user: " + banEmail + "    banPhone: " + banPhone)

	if (banEmail !== "") {
		fetch('/search-email/' + banEmail).then(res => {
			return res.json()
		}).then(resp => {
			if (resp.active === true) {
				fetch('/ban-user/' + resp.account_num).then(res => {
					console.log("BANNED")
				})
			} else {
				alert("This user is already banned!")
			}
		}).catch(err => {
			console.log("Error Occurred: " + err)
		})
	}
	else if (banPhone !== "") {
		fetch('/search-phone-num/' + banPhone).then(res => {
			return res.json()
		}).then(resp => {
			if (resp.active === true) {
				fetch('/ban-user/' + resp.account_num).then(res => {
					console.log("BANNED!")
				})
			} else {
				alert("This user is already banned!")
			}

		}).catch(err => {
			console.log("Error Occurred: " + err)
		})
	} else {
		alert("Both fields are blank!")
	}

}

function replaceNavbarItems() {
	/*
	This function replaces the menu items at the top navigation bar. On certain pages, we want different 
	menu items to be displayed on the navigation bar. 
	*/
	alert("LOL")
	fetch('/get-cookie')
		.then(res => {
			log(res);
			if (res !== {}) {
				log("line 154")
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

				document.querySelectorAll('.nav-item').forEach(function (a) {
					if (!(a.children[0].className.includes("nav-link logout-btn"))) {
						a.remove()
					}
				});
				navStats.appendChild(statsItem);
				entireNavBar.appendChild(navStats);

				newNavItem.appendChild(settingsItem);
				entireNavBar.appendChild(newNavItem);
				log("line 179")
			}
			log("shouldnt be here")
		})
}

function replaceBackButton() {
	/*
	This function adds a "Back" button to the top navigation bar, to allow the user to go back to the 
	main dashboard view from the Settings or any other page. 
	*/
	const entireNavBar = document.getElementsByClassName("navbar navbar-expand-lg navbar-dark bg-dark fixed-top")[0]

	const newNavItem = document.createElement('nav-item')
	const settingsItem = document.createElement('a')
	settingsItem.className = "nav-link"
	settingsItem.onclick = toDashboard
	settingsItem.text = "Back"
	settingsItem.style.color = "white";

	document.querySelectorAll('.nav-item').forEach(function (a) {
		a.remove()
	})

	newNavItem.appendChild(settingsItem)
	entireNavBar.appendChild(newNavItem)
}

function updateLPs() {
	/*
	This function extracts the license plate numbers entered by the user and submits a subsequent POST 
	request to the /update-lp route on the server, in order to update the license plate numbers for a user 
	stored on the database 
	*/
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
			if (res.status !== 200) {
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

function updatePersonalDetails() {
	/*
	This function extracts personal details (such as first name, last name, etc) entered by the user 
	and submits a subsequent POST request to the /update-account-details route on the server, in order 
	to update the personal user details stored on the database 
	*/
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
			if (res.status !== 200) {
				alert("An error occurred with updating the details! Error code: " + res.status.toString())
				return Promise.reject(1)
			} else {
				console.log("The response of the sign-up is: ", res)
				if (password !== "" && confirmPassword !== "" && password === confirmPassword) {
					updatePassword()
				}
				alert('Success!');
				location.reload();
				return false;
			}
		}).catch(err => {
			console.log(err)
			alert("An error ocurred with updating the details! Error Code: " + err)
			return Promise.reject(1)
		})


	})

}

function updatePassword() {
	/*
	This function extracts the password (and confirm password) entered by the user, and then submits 
	a subsequent POST request to the /update-pw route on the server in order to update the user passwords 
	stored on the database 
	*/
	const password = document.getElementById("account-pass").value
	const confirmPassword = document.getElementById("account-confirm-pass").value

	fetch('/update-pw/' + password).then(res => {
		return res.json()
	}).then(resp => {
		console.log("Password Successfully Changed!")
	})
}

function toDashboard() {
	/*
	This function redirects the user to the main dashboard page by submitting a GET request to the 
	/dashboard route 
	*/
	window.location.href = '/dashboard'
}

function obtainPersonalInfo(e) {
	/*
	THis function obtains the personal user info (such as first name, last name, etc) from the database 
	and displays it on the Settings page 
	*/
	console.log("obtaining personal info....")
	replaceBackButton()

	fetch("/get-cookie")
		.then(res => {
			return res.json()
		}).then(res => {
			console.log("ACCOUNT TYPE IS " + res.userData.acctType)
			if (res.userData.acctType === "plm") {
				showAcctSettingsTab()
				showSubBanReqTab()
			}
			if (res.userData.acctType == "user") {
				showAcctSettingsTab()
			}

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

function showSubBanReqTab() {
	/*
	This function modifies the "hidden" property of the "Submit Ban Request" tab and sets it to false 
	in order to display it on the view 
	*/
	const subBanReqTab = document.getElementById("subbanreq")
	subBanReqTab.hidden = false
}

function showAcctSettingsTab() {
	/*
	This function modifies the "hidden" property of the "Account Settings" tab and sets it to false 
	in order to display it on the view 
	*/
	const acctSettingsTab = document.getElementById("acctSettings")
	acctSettingsTab.hidden = false
}

function populateUserInfo(userInfo) {
	/*
	This function is given an object containing user information and populates/displays the data 
	on the frontend 
	*/
	console.log("reached popualteUserIfo")
	console.log(userInfo)
	const firstLicensePlate = document.getElementById("account-lpn")
	firstLicensePlate.value = userInfo[0].license_num;
	const secondLicensePlate = document.getElementById("account-lpn2")
	if (userInfo.length > 1) {
		secondLicensePlate.value = userInfo[1].license_num;
	} else {
		secondLicensePlate.value = ""
	}

	console.log(userInfo[0].license_num)

}

function populatePersonalInfo(personalInfo) {
	/*
	This function is given an object containing personal user information and populates/displays the data 
	on the frontend 
	*/
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

function logout(e) {
	/*
	This function submits a GET request to the /logout route on the server and redirects the user 
	to the main dashboard 
	*/
	fetch('/logout').then(res => {
		if (res.status !== 200) { console.log("Logout unsuccessful"); }
		else {
			console.log("Logout Successful");
			window.location.href = '/'
		}
	})
}


function addNewDriver(e){
	/*
	This function adds a new driver account to the system 
	*/
	addNewUser("user").then((result) => {
		window.location.href = '/enter-lp-nums';
	}).catch((err) => {
		alert(`An error occurred with driver signup: ${err}`);

	});
}


function addNewPLM(e){
	/*
	This function adds a new parking lot manager account to the system 
	*/
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
	for (var i = 0, max = radios.length; i < max; i++) {
		radios[i].onclick = function () {
			let displaySetting;
			log("This dot value is ", this.value);
			if (this.value != 'other' && this.value != '') {
				displaySetting = 'none';
			}
			else {
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
	for (let i = 0; i < radios.length; i++) {
		log("Radios i is: ", radios[i]);
		if (radios[i].checked) {
			//alert("The radio that was checked is: ", radios[i].value);
			output.push(radios[i].value);
		}
	}
	return output;
};

function scorePassword(pass) {
	/*
	This function generates a score for the user-entered password in order to convey to the user 
	how strong their password is 
	*/
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
	/*
	This function determines if the password score - generated by the scorePassword() function - is 
	strong, good, weak, or very weak. 
	*/
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
	/*
	This function modifies the DOM and displays the password strength to the user's screen 
	in real time 
	*/
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

function viewSubmittedBanRequests(){
	/*
	This function makes a fetch() requests to the /get-plm-requests/:accountNum route 
	in order to obtain and display the ban requests that have been submitted by this 
	parking lot manager 
	*/
	document.getElementsByClassName("table")[0].hidden = false
	console.log("Now Loading...")
	fetch('/get-cookie').then(res => {
		return res.json()
	}).then(resp => {
		fetch('/get-plm-requests/' + resp.userData.accountNum).then(res => {
			return res.json()
		}).then(submittedRequests => {
			for (let i = 0; i < submittedRequests.length; i++) {
				addRequestToDOM(submittedRequests[i])
			}
		})
	}).catch(err => {
		console.log("Error Occurred: ")
		console.log(err)
	})
}

function addRequestToDOM(request){
	/*
	This function takes a request and displays it on the DOM. This function is called repeatedly 
	in the viewSubmittedBanRequests() function for each request 
	*/
	const requestsTable = document.getElementsByClassName("table")[0]
	const tBody = requestsTable.children[1].children

	const newTR = document.createElement('tr')

	const tdOne = document.createElement('td')
	tdOne.appendChild(document.createTextNode(request.title))

	const tdTwo = document.createElement('td')
	tdTwo.appendChild(document.createTextNode(request.related_acc))

	const tdThree = document.createElement('td')
	tdThree.appendChild(document.createTextNode(status(request.resolved)))

	const tdFour = document.createElement('td')
	tdFour.appendChild(document.createTextNode(reformatDate(request.add_date)))

	newTR.appendChild(tdOne)
	newTR.appendChild(tdTwo)
	newTR.appendChild(tdThree)
	newTR.appendChild(tdFour)

	requestsTable.appendChild(newTR)
}


function status(resolved){
	/*
	This is a helper function that simply converts a boolean value (true or false) into 
	a String holding "Accepted" or "Under Review", respectively. 
	*/
	if(resolved === true){
		return "Accepted"
	} else {
		return "Under Review"
	}
}

function printSubmittedBanRequests(submittedRequests){
	/*
	This is a helper function that prints all the requests that we obtained from the server. This function 
	was used primarily for testing. 
	*/

	for (let i = 0; i < submittedRequests.length; i++) {
		console.log(submittedRequests[i].title + "    " + submittedRequests[i].description + "   " + submittedRequests[i].resolved)
	}
}

function redirectUserPLMsettings(){
	/*
	This function determines if the account type is "user" or "plm" (it determines this from the cookie) 
	and then redirects the user to the user settings page or the plm settings page 
	*/
	fetch("/get-cookie")
		.then(res => {
			return res.json()
		}).then(res => {
			if (res.userData.acctType == "user") {
				window.location.href = '/user-settings-page';
			} else {
				window.location.href = '/plm-settings-page';
			}
		}).catch((err) => {
			console.log(err)
		})

}

function redirectSettingsPage(){
	/*
	This function redirects the user to the settings page 
	*/
	window.location.href = '/settings-page'
}

function reachedBanForm(){
	/*
	This is an onload() function for the ban-form HTML page. It invokes a variety of other functions 
	that set the screen properly, such as replacing the navigation bar menu items, replacing the name 
	of the user displayed, and replacing the back button. 
	*/
	console.log("Reached Ban Form")
	replaceNavbarItems()
	replaceName()
	replaceBackButton()
}

function obtainUserInfo(){
	/*
	This function obtains information about the user, such as the license plate number of the user 
	and displays it on the Settings page screen 
	*/
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
	/*
	This function obtains the name of the user from the server and displays it on the Settings page 
	*/
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
	/*
	This function obtaiins a variety of information about the parking lot manager and 
	displays it on the Settings page 
	*/
	replaceBackButton()
	replaceName()
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
			if (!res[0]) {
				console.log(res.lot_id + "ya")
				handlenolots()
			}
			else {
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
	/*
	This function handles the case where the parking lot manager does not have any parking lots 
	*/
	const inputLabels = document.getElementsByClassName("nolot");
	for (let i = 0; i < inputLabels.length; i++) {
		let currentElement = inputLabels[i];
		currentElement.value = ""
	}
	var header = document.getElementById("plmsettingsheader")
	header.innerHTML = "<h3>You have no lots, add one here:</h3><br><br>"
	var button = document.getElementById("updateplmbtn")
	button.innerText = "Add Parking Lot"
	button.onclick = addParkingLotFromSettings

	var lotName = document.getElementById("account-lotname")
	lotName.id = "lotName"
	lotName.text = ""
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

function submitBanRequest(e){
	/*
	This function extracts the user-entered information (such as email of the person to ban, phone number 
	of the person to ban, etc) and submits a request to the /send-request route, in order to submit 
	a new ban request 
	*/
	const emailToBan = document.getElementById("ban-email").value.trim()
	const phoneToBan = document.getElementById("ban-phone").value.trim()
	const descriptionBan = document.getElementById("ban-description").value.trim()
	const titleBan = document.getElementById("ban-title").value.trim()

	document.getElementById("ban-email").value = ""
	document.getElementById("ban-phone").value = ""
	document.getElementById("ban-description").value = ""
	document.getElementById("ban-title").value = ""

	fetch("/get-cookie")
		.then(res => {
			return res.json()
		}).then(res => {
			const accountNumOfSubmitter = res.userData.accountNum

			if (emailToBan !== "") {
				fetch('/search-email/' + emailToBan).then(res => {
					console.log("here ")
					return res.json()
				}).then(resp => {
					if (resp.active === false) {
						alert("This user is already banned!")
					} else {

						const banRequestData = {
							request: {
								fromAcc: accountNumOfSubmitter,
								description: descriptionBan,
								toAcc: 100,
								relatedAcc: resp.account_num,
								type: "ban request",
								title: titleBan
							}
						};


						const banReq = new Request('/send-request', {
							method: "post",
							body: JSON.stringify(banRequestData),
							headers: {
								'Accept': 'application/json, text/plain, /',
								'Content-Type': 'application/json'
							}
						});


						fetch(banReq).then(res => {
							alert("Ban Request Submitted!")
						}).catch(err => {
							console.log("Error Occurred")
						})

					}

				})
			}
			else if (phoneToBan !== "") {
				fetch('/search-phone-num/' + phoneToBan).then(res => {
					return res.json()
				}).then(resp => {
					if (resp.active === false) {
						alert("This user is already banned!")
					} else {

						const banRequestData = {
							request: {
								fromAcc: accountNumOfSubmitter,
								description: descriptionBan,
								toAcc: 100,
								relatedAcc: resp.account_num,
								type: "ban request",
								title: titleBan
							}
						};

						const banReq = new Request('/send-request', {
							method: "post",
							body: JSON.stringify(banRequestData),
							headers: {
								'Accept': 'application/json, text/plain, /',
								'Content-Type': 'application/json'
							}
						});

						fetch(banReq).then(res => {
							alert("Ban Request Submitted!")
						}).catch(err => {
							console.log("Error Occurred")
						})

					}

				})
			}
		}).catch(err => {
			console.log("Error Ocurred")
		})

}

function toBanForm(){
	/*
	This function redirects the user to the ban form HTML page 
	*/
	window.location.href = '/ban-form'
}

function adminDisplay() {
	console.log("Admin Logged In!")
}


function updatePLMsettings(){
	/*
	This function extracts several user-entered information for the parking lot manager and 
	submits a request to the /update-pl route to update the parking lot manager information 
	in the database 
	*/
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
				body: JSON.stringify(newUserData),
				headers: {
					'Accept': 'application/json, text/plain, /',
					'Content-Type': 'application/json'
				}
			});

			return fetch(newUserReq).then(res => {
				if (res.status !== 200) {
					alert("An error occured with adding the user! Error code: " + res.status.toString());
					return Promise.reject(1);
				}
				else {
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

function addNewUser(userType) {

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

	if (firstName === "" || lastName === "" || email === "" || phoneNumber === "" || password === "") {
		alert("Please fill in both fields and try again, thanks!");
		return Promise.reject(1);
	}

	if (!validateEmail(email)) {
		alert("Email is invalid! Try again.");
		return Promise.reject(1)
	}

	if (parseInt(phoneNumber) < 0) {
		alert("You may not use a negative phone number!")
		return Promise.reject(1)
	}

	if (email.indexOf("TEMPORARY_ACCOUNT") > -1) {
		alert("You may not use a temporary account email!")
		return Promise.reject(1)
	}

	if (password !== confirmPassword) {
		alert("Passwords do not match!");
		return Promise.reject(1)
	}

	console.log("Adding new user...");

	const newUserData = {
		newUser: {
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
		body: JSON.stringify(newUserData),
		headers: {
			'Accept': 'application/json, text/plain, /',
			'Content-Type': 'application/json'
		}
	});

	return fetch(newUserReq).then(res => {
		if (res.status !== 200) {
			alert("An error occured with adding the user! Error code: " + res.status.toString());
			return Promise.reject(1);
		}
		else {
			log("The response of the sign-up is: ", res);
			return Promise.resolve(0);
		}

	}).catch(err => {
		console.log(err);
		alert("An error occured with adding the user! Error code: " + err);
		return Promise.reject(1);
	})
}


function reformatDate(date) {
	//let timePassedIn = "2004-10-19T14:53:54.000Z"; // the format of the input MUST be this
	let timePassedIn = date
	//console.log("time passed in is : " + date);
	var newD = new Date(timePassedIn);
	var tempArray = newD.toString().split(" ");
	let newString = "";

	for (let i = 0; i < 5; i++) {
		newString += tempArray[i] + " "
	}

	return newString
}

function addLicensePlates(e) {
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
function logout(e) {
	console.log("Logging out...");
	const url = '/logout';
	fetch(url).then(res => {
		if (res.status !== 200) {
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

function obtainPLMTransactions() {
	console.log("Obtaining PLM Transactions...");

	// make a fetch request to get the cookie first to get the user's email 
	let cookieUrl = "/get-cookie";
	let urlEmail = "";
	let urlParkingLotId = "";
	let urlPLMTransactions = "";

	return fetch(cookieUrl)
	.then(res => {
		if(res.status !== 200){
			console.log("An error occurred in obtaining the cookie: Response was not 200");
			return {} 
		} else {
			return res.json() 
		}
	})
	.then(result => {
		if(result !== {}){
			urlEmail = "/search-email/" + result.userData.email;
			return fetch(urlEmail);
		} else {
			return null; 
		}
	})
	.then(result => {
		console.log(result)
		return result.json(); 
	})
	.then(accountNum => {
		if(accountNum !== null){
			urlPLMTransactions = "/get-trans-forall-plm-lots/" + accountNum.account_num;
			console.log(urlPLMTransactions);
			return fetch(urlPLMTransactions);
		} else {
			return null;
		}
	})
	.then(resp => {
		console.log(resp);
		return resp.json();
	})
	.catch(err => {
		console.log("Error Occurred: " + err);
	});
}

function generatePLMStats() {
	let transactions = obtainPLMTransactions();
	transactions.then(res => {
		if (res.length == 0) {
			return 0;
		}
		console.log("Got transactions");
		let numTransactions = res.length;
		let total = totalSpend(res);
		showTotalSpend(total);
		showAvgSpend(total, numTransactions);
		let lotStats = getLotStats(res);
		let numTransac = lotStats['numTransac'];
		let revenue = lotStats['revenue'];
		let numUsers = lotStats['numUsers'];
		// showPerLot('numTransactions', numTransac);
		// showPerLot('revenue', revenue);
		// showPerLot('numUsers', numUsers);
		showTotalUsers(numUsers);
		showNumTransactions(res);
		showTimeParked(res);
		console.log("Got All stats")
	})
		.catch(error => {
			console.log(`Error in the promise encountered! Error was the following; ${error}`)
		})
}


function generateUserStats() {
	let transactions = obtainTransactions();
	transactions.then(res => {
		if (res.length == 0) {
			return 0;
		}
		else {
			console.log("Got transactions");
			let num = showNumTransactions(res);
			let total = totalSpend(res);
			showTotalSpend(total);
			showAvgSpend(total, num);
			let lotStats = getLotStats(res);
			showTimeParked(res);
			console.log("Got All stats")
		}
	})
		.catch(error => {
			console.log(`Error in the promise encountered! Error was the following; ${error}`)
		})
}
function showTotalUsers(users) {
	let total = 0
	for (var lot in users) {
		total += users[lot];
	}
	document.getElementById('totalVisitors').innerHTML = String(total);
}

function parkTime(t1, t2) {
	let timeEntered = new Date(t1);
	let timeExited = new Date(t2);
	let time = (timeExited - timeEntered) / 1000. / 3600.;
	return time
}

function showTimeParked(transactions) {
	let time = 0;
	let longestTime = 0;
	for (let i = 0; i < transactions.length; i++) {
		if (!(transactions[i]["time_entered"] == null || transactions[i]["time_exited"] == null)) {
			let curTime = parkTime(transactions[i]["time_entered"], transactions[i]["time_exited"]);
			time += curTime;
			if (curTime > longestTime) {
				longestTime = curTime;
			}
		}
	}
	let avgTime = (time / transactions.length).toFixed(1);
	console.log(avgTime);
	document.getElementById('timeParked').innerHTML = String(avgTime) + " hours";
	document.getElementById('longestTimeParked').innerHTML = String(longestTime.toFixed(1)) + " hours";
	return [avgTime, longestTime]
}

function showTransactionHistory() {
	return fetch('/get-cookie')
	.then( res =>{
		return res.json()
	})
	.then(res => {
		// console.log(res.userData);
		// let transactions = ''
		if (res.userData.acctType == "user") {
			return obtainTransactions();
			
		}
		return obtainPLMTransactions();
	}).then(res => {
		populateTable(res, "dynamicTable");
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

function totalSpend(transactions) {
	let numEntries = transactions.length
	let totalCost = 0;
	for (let i = 0; i < numEntries; i++) {
		let cost = transactions[i]["cost"];
		if (cost !== null) {
			totalCost += parseFloat(cost)
		}
	}
	console.log(totalCost);
	console.log("Got total amount");
	return totalCost
}

function showTotalSpend(total) {
	document.getElementById('totalSpend').innerHTML = "$" + String(total.toFixed(2));
}

function showAvgSpend(totalSpend, numTransactions) {
	let avgSpend = totalSpend / numTransactions;
	document.getElementById('avgSpend').innerHTML = "$" + String(avgSpend.toFixed(2));
	return avgSpend;
}

function getLotStats(transactions) {
	let numEntries = transactions.length;
	let uniqueLots = 0;
	let numTransac = {};
	let revenue = {};
	var users = {};
	var hoursParked = {};
	for (let i = 0; i < numEntries; i++) {
		let lot = transactions[i]["lot_id"]
		let cost = transactions[i]["cost"]
		let accNum = transactions[i]["account_num"]
		let curTime = parkTime(transactions[i]["time_entered"], transactions[i]["time_exited"]);
		if (!(lot in numTransac)) {
			numTransac[lot] = 1;
			if (cost !== null) {
				revenue[lot] = parseFloat(cost);
			}
			users[lot] = [accNum];
			hoursParked[lot] = 0
			uniqueLots += 1;
		}
		else {
			if (users[lot].indexOf(accNum) < 0) {
				users[lot].push(accNum)
			}
			numTransac[lot] += 1;
			if (cost !== null) {
				revenue[lot] += parseFloat(cost);
			}
			hoursParked[lot] += curTime;
		}

	}
	console.log(users);
	let numUsers = {};
	for (var lot in users) {
		numUsers[lot] = users[lot].length
	}
	document.getElementById('lotsVisited').innerHTML = String(uniqueLots);
	// document.getElementById('mostFreq').innerHTML = String(mostFreqLot);
	return { 'numTransac': numTransac, 'revenue': revenue, 'numUsers': numUsers };
}

function redirectStatsPage() {
	fetch('/get-cookie')
		.then(res => {
			return res.json()
		})
		.then(res => {
			// console.log(res.userData);
			if (res.userData.acctType == "user") {
				window.location.href = '../html/stats_user.html';
			} else {
				window.location.href = '../html/stats_plm.html'
			}
		}).catch((err) => {
			console.log(err)
		})

}

function addTextToStatCard(id, text) {
	var node = document.createElement("card-text");                 // Create a <li> node
	var textnode = document.createTextNode(text);         // Create a text node
	node.appendChild(textnode);                              // Append the text to <li>
	document.getElementById(id).appendChild(node);
	console.log("stat added.")
}


function addParkingLotFromSettings() {
	console.log('Adding a new parking lot...')
	fetch('/get-cookie')
	.then(res => {
		return res.json()
	})
	.then(res => {
		console.log(res);
		//const lotName = document.getElementsByClassName("form-control")[0].value;
		const lotName = document.getElementById("lotName").value.trim();
		//const address = document.getElementsByClassName("form-control")[1].value;
		const address = document.getElementById("address").value.trim(); 
		//const capacity = Number(document.getElementsByClassName("form-control")[2].value);
		const capacity = document.getElementById("capacity").value.trim();
		//const type = document.getElementsByClassName("form-control")[3].value;
		const type = document.getElementById("type").value.trim().toLowerCase(); 
		//const restriction = document.getElementsByClassName("form-control")[4].value;
		const restriction = document.getElementById("restrictions").value.trim(); 
		//const description = document.getElementsByClassName("form-control")[5].value;
		const description = document.getElementById("description").value.trim();

		if (lotName == '' || address  == '' || capacity <= 0 || restriction == '' || description == ''){
			alert("Please fill in all fields, and make sure that capacity is a positive integer");
			return;
		}

		if (type !== 'underground' && type !== 'street parking' && type !== 'above ground' && type !== 'other'){
			Alert('The type must be one of `underground`, `street parking`, `above ground` and `other`.');
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
		log(newParkingLotData)
		return Promise.resolve(newParkingLotData)
	})
	.then(result => {
		console.log(result);
		const parkingLotRequest = new Request('/add-parking-lot', {
			method: "post", 
			body: JSON.stringify(result), 
			headers: {
				"Accept": "application/json, text/plain, */*",
				"Content-Type": "application/json"
			}
		});
		return fetch(parkingLotRequest)
	})
	.then(res => {
		if (res.status !== 200) {
			console.log("Error: " + res.body.error); 
			alert(res.body.error);
		} else {
			alert('Parking Lot Added!');
			window.location.href = '/pricing-default'
		}
	})
	.catch(error => alert(error));
}


function addParkingLot(e) {
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

		if (lotName == '' || address == '' || capacity <= 0 || restriction == '' || description == '') {
			alert("Please fill in all fields, and make sure that capacity is a positive integer");
			return;
		}
		log("type is: ", type);
		const newParkingLotData = {
			parkingLotInfo: {
				lotName: lotName,
				address: address,
				capacity: capacity,
				type: type,
				restriction: restriction,
				description: description
			},
			accountNum: res.userData.accountNum
		};
		log(newParkingLotData)
		return Promise.resolve([newParkingLotData, findSelectedOptions(), type]);
	}).then((returnVal) => {
		log("The selected options are: ", returnVal[1]);
		log("Return val 0 is ", returnVal[0]);
		if (returnVal[1][0] != 'other') {
			returnVal[0].parkingLotInfo.type = returnVal[1][0];
		}
		log("Return val 0 is ", returnVal[0].parkingLotInfo.type);
		return Promise.resolve(returnVal[0]);
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
			window.location.href = '/pricing-default'
		}
	})
		.catch(err => {
			console.log("Error Occurred: " + err)
		})

}


function obtainPLMTransactions(){
	console.log("Obtaining PLM Transactions...");

	// make a fetch request to get the cookie first to get the user's email 
	let cookieUrl = "/get-cookie";
	let urlEmail = "";
	let urlParkingLotId = "";
	let urlPLMTransactions = "";
	return fetch(cookieUrl)
	.then(res => {
		if(res.status !== 200){
			console.log("An error occurred in obtaining the cookie: Response was not 200");
			return {}
		} else {
			return res.json()
		}
	})
	.then(result => {
		if(result !== {}){
			urlEmail = "/search-email/" + result.userData.email;
			return fetch(urlEmail);
		} else {
			return null;
		}
	})
	.then(result => {
		return result.json(); 
	})
	.then(accountNum => {
		if(accountNum !== null){
			urlPLMTransactions = "/get-trans-forall-plm-lots/" + accountNum.account_num;
			return fetch(urlPLMTransactions);
		} else {
			return null;
		}
	})
	.then(resp => {
		//console.log(resp);
		return resp.json();
	})
	.catch(err => {
		console.log("Error Occurred: " + err);
	});
}

function populateTable(transactions, tableid) {
	// this function, when complete, will accept the JSON object obtained from the /obtaintransactions route and 
	// populate the table on the front end with that data 

	var numEntries = transactions.length;

	if (numEntries > 0) {
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
				//console.log(JSON.stringify(transactions[i][col[j]]).substring(1,8));
				if (JSON.stringify(transactions[i][col[j]]).substring(0, 8).match(regex)) {
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
		var divContainer = document.getElementById(tableid);
		divContainer.innerHTML = "";
		divContainer.appendChild(table);
	}
	else {
		console.log("Array empty");
	}

}
function adminDisplay() {
	console.log("Admin Logged In!")
	obtainAndDisplayAdminBans()
	obtainAndDisplayAdminLotReqs()
	obtainAndDisplayBannedUsers()
}

function obtainAndDisplayBannedUsers() {
	fetch('/get-banned-users').then(res => {
		return res.json()
	}).then(resp => {
		populateTable(resp, "dynamicTable2")
	})
}


function obtainAndDisplayAdminLotReqs() {
	console.log("Obtaining lots...");
	let url2 = '/get-reqs-of-type';
	const requestData2 = { "type": "parking lot request" };

	const lotReq = new Request(url2, {
		method: "post",
		body: JSON.stringify(requestData2),
		headers: {
			'Accept': 'application/json, text/plain, /',
			'Content-Type': 'application/json'
		}
	});
	console.log(JSON.stringify(requestData2))
	fetch(lotReq).then(res => {
		return res.json()
	})
		.then(res => {
			const unresolved = res.filter(entry => !entry.resolved)
			populateTable(unresolved, "dynamicTable1")
		})
		.catch(err => {
			console.log("Error Occurred")
		});
}
function obtainAndDisplayAdminBans() {
	console.log("Obtaining bans...");
	let url = '/get-reqs-of-type';
	const requestData = { "type": "ban request" };

	const banReq = new Request(url, {
		method: "post",
		body: JSON.stringify(requestData),
		headers: {
			'Accept': 'application/json, text/plain, /',
			'Content-Type': 'application/json'
		}
	});
	console.log(JSON.stringify(requestData))
	fetch(banReq).then(res => {
		return res.json()
	})
		.then(res => {
			const result = res.filter(entry => !entry.resolved)
			populateTable(result, "dynamicTable")
		})
		.catch(err => {
			console.log("Error Occurred")
		});
}

function weekdayRates(e) {
	window.location.href = '/weekday-rates';
}

function weekendRates(e) {
	window.location.href = '/weekend-rates';
}

function longtermRates(e) {
	window.location.href = '/longterm-rates';
}

function specialRates(e) {
	window.location.href = '/special-rates';
}

function addPricing(e) {
	window.location.href = '/dashboard';
}

function addDefaultRate(e) {

	console.log("Adding new default rate..");
	fetch("/get-cookie").then(resp => {
		return resp.json()
	}).then(res => {
		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum);
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res[0].lot_id);

			const defaultRate = Number(document.getElementById("default-rate").value);

			if (defaultRate <= 0) {
				alert("Please make sure rate is a positive integer");
				return;
			}

			console.log("Default rate: " + defaultRate)

			const startTime = "00:00:00"
			const endTime = "23:59:59"

			const defaultWeekdayRate = {
				type: 1,
				params: {
					lot_id: res[0].lot_id,
					mon: false,
					tues: false,
					wed: false,
					thurs: false,
					fri: false,
					time_length: -1,
					cost: defaultRate,
					start_time: startTime,
					end_time: endTime
				}
			};

			console.dir(defaultWeekdayRate);

			const defaultWeekdayRequest = new Request('/add-parking-rate', {
				method: "post",
				body: JSON.stringify(defaultWeekdayRate),
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			});

			log("The weekday rate request is: ", defaultWeekdayRequest);

			fetch(defaultWeekdayRequest).then(res => {
				if (res.status !== 200) {
					console.log("Error: " + res.body.error);
					alert(res.body.error);
				}

			}).catch(error => {
				console.log("Error occured: " + error);
			})

			const defaultWeekendRate = {
				type: 2,
				params: {
					lot_id: res[0].lot_id,
					sat: false,
					sun: false,
					time_length: -1,
					cost: defaultRate,
					start_time: startTime,
					end_time: endTime
				}
			};

			console.dir(defaultWeekendRate);

			const defaultWeekendRequest = new Request('/add-parking-rate', {
				method: "post",
				body: JSON.stringify(defaultWeekendRate),
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			});
			log("The weekend rate request is: ", defaultWeekendRequest);

			fetch(defaultWeekendRequest).then(res => {
				if (res.status !== 200) {
					console.log("Error: " + res.body.error);
					alert(res.body.error);
				}

			}).catch(error => {
				console.log("Error occured: " + error);
			})

			const defaultSpecialRate = {
				type: 4,
				params: {
					lot_id: res[0].lot_id,
					day: "1999-01-01",
					time_length: -1,
					cost: defaultRate,
					start_time: startTime,
					end_time: endTime
				}
			};

			console.dir(defaultSpecialRate);

			const defaultSpecialRequest = new Request('/add-parking-rate', {
				method: "post",
				body: JSON.stringify(defaultSpecialRate),
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Content-Type": "application/json"
				}
			});
			log("The special rate request is: ", defaultSpecialRequest);

			fetch(defaultSpecialRequest).then(res => {
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

	}).catch(error => {
		console.log("Error occured: " + error);
	})

}

function addWeekdayRate(e) {

	console.log("Adding new weekday rate..");
	fetch("/get-cookie").then(resp => {
		return resp.json()
	}).then(res => {

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

			const cost = Number(document.getElementById("cost").value);

			const timeLength = 60;

			if (cost <= 0) {
				alert("Please make sure time length and cost are positive integers");
				return;
			}

			let startTime = document.getElementById("start-time").value;
			let endTime = document.getElementById("end-time").value;

			startTime = startTime + ":00";
			endTime = endTime + ":00";

			console.log("The value of start time: " + startTime);
			console.log("The value of end time: " + endTime);

			const newWeekdayRate = {
				type: 1,
				params: {
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
			if (res.status == 409) {
				console.log("Error: " + res.body.error);
				alert("The proposed rate conflicts with the existing rates for this parking lot. Please try again!");
			} else if (res.status !== 200) {
				console.log("Error: " + res.body.error);
				alert("Error in adding the lot rate. Please try again!");
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

function addWeekendRate(e) {

	console.log("Adding new weekend rate..");
	fetch("/get-cookie").then(resp => {
		return resp.json()
	}).then(res => {

		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum);
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res[0].lot_id);
			const sat = document.getElementsByClassName("form-checkbox")[0].checked;
			const sun = document.getElementsByClassName("form-checkbox")[1].checked;

			const cost = Number(document.getElementById("cost").value);

			const timeLength = 60;

			if (cost <= 0) {
				alert("Please make sure time length and cost are positive integers");
				return;
			}

			let startTime = document.getElementById("start-time").value;
			let endTime = document.getElementById("end-time").value;

			startTime = startTime + ":00";
			endTime = endTime + ":00";

			console.log("The value of start time: " + startTime);
			console.log("The value of end time: " + endTime);

			const newWeekendRate = {
				type: 2,
				params: {
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
			if (res.status == 409) {
				console.log("Error: " + res.body.error);
				alert("The proposed rate conflicts with the existing rates for this parking lot. Please try again!");
			} else if (res.status !== 200) {
				console.log("Error: " + res.body.error);
				alert("Error in adding the lot rate. Please try again!");
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

function addLongtermRate(e) {

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

			if (isMonthly) {
				dayLength = -30;
			}
			else if (isYearly) {
				dayLength = -365;
			}

			console.log("Day length is: " + dayLength)

			const cost = Number(document.getElementById("cost").value);

			if (cost <= 0) {
				alert("Please make sure cost is a positive integer");
				return;
			}

			const newLongtermRate = {
				type: 3,
				params: {
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
			if (res.status == 409) {
				console.log("Error: " + res.body.error);
				alert("The proposed rate conflicts with the existing rates for this parking lot. Please try again!");
			} else if (res.status !== 200) {
				console.log("Error: " + res.body.error);
				alert("Error in adding the lot rate. Please try again!");
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

function addSpecialRate(e) {

	console.log("Adding new special rate..");
	fetch("/get-cookie").then(resp => {
		return resp.json()
	}).then(res => {

		let urlParkingLotId = "/get-parking-lot-id/" + Number(res.userData.accountNum);
		fetch(urlParkingLotId).then(resp => {
			return resp.json()
		}).then(res => {
			console.log("Parking lot output: " + res[0].lot_id);
			const date = document.getElementById("special-day").value;

			console.log("Date is: " + date)

			const cost = Number(document.getElementById("cost").value);

			const timeLength = 60;

			if (cost <= 0) {
				alert("Please make sure time length and cost are positive integers");
				return;
			}

			let startTime = document.getElementById("start-time").value;
			let endTime = document.getElementById("end-time").value;

			startTime = startTime + ":00";
			endTime = endTime + ":00";

			console.log("The value of start time: " + startTime);
			console.log("The value of end time: " + endTime);

			const newSpecialRate = {
				type: 4,
				params: {
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
			if (res.status == 409) {
				console.log("Error: " + res.body.error);
				alert("The proposed rate conflicts with the existing rates for this parking lot. Please try again!");
			} else if (res.status !== 200) {
				console.log("Error: " + res.body.error);
				alert("Error in adding the lot rate. Please try again!");
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
function authenticate(e) {
	console.log("Authenticating...");
	document.getElementById("loginbtn").disabled = true;
	const url = "/authenticate";

	let redirectTo = '/dashboard'

	const emailEntered = document.getElementsByClassName("form-control")[0].value;
	console.log("Email entered is: " + emailEntered);

	const passwordEntered = document.getElementsByClassName("form-control")[1].value;
	console.log("Password entered is: " + passwordEntered);

	if (emailEntered === "" || passwordEntered === "") {
		document.getElementById("loginbtn").disabled = false;
		var curErrors = document.getElementById("errormessage");
		if (curErrors) {
			curErrors.remove();
		}
		var elm = document.createElement('div');
		elm.id = "errormessage";
		elm.innerHTML = "Please fill in both fields and try again, thanks!";
		document.getElementById("loginform").appendChild(elm);

		return;
	}


	if (emailEntered === "admin@admin.ca") {
		redirectTo = '/admin-page'
	}

	const userData = {
		user: {
			email: emailEntered,
			password: passwordEntered
		}
	};

	const authRequest = new Request(url, {
		method: "post",
		body: JSON.stringify(userData),
		headers: {
			'Accept': 'application/json, text/plain, /',
			'Content-Type': 'application/json'
		}
	});

	console.log("fetching authrequest rn")


	fetch(authRequest).then(res => {
		if (res.status !== 200) {
			return res.json();
		}

		window.location.href = redirectTo
	})
		.then(result => {
			document.getElementById("loginbtn").disabled = false;
			var curErrors = document.getElementById("errormessage");
			if (curErrors) {
				curErrors.remove();
			}
			var elm = document.createElement('div');
			elm.id = "errormessage";
			elm.innerHTML = result.error;
			document.getElementById("loginform").appendChild(elm);
		})
		.catch(error => console.log(error));

}

