'use strict'
"The main server file for Breeze."

const log = console.log;
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dbInterface = require('./db_interface');
const port = 5000;
const app = express();
app.use(bodyParser());
app.use(cookieParser());

const redirectIfLoggedIn = (req, res, next) => {
    /**
     * Express middleware to check if the user is already logged in.
     * If so, redirect them to the dashboard.
     */
    if (req.cookies.userData) {
        res.redirect('/dashboard'); // redirect to dashboard if logged in.
    } else {
        next(); // Return control to the calling route.
    }
};

const redirectIfLoggedOut = (req, res, next) => {
    /**
     * Middleware to check if someone is not logged in. If not, redirect
     * them out to the splash page
     */
    if (!req.cookies.userData) {
        res.redirect('/'); // redirect to splash page if not logged in.
    } else {
        next(); // Return control to the calling route.
    }
};

app.get('/', redirectIfLoggedIn, (req, res) => {
    /**
     * The landing page.
     * Redirects to dashboard if the user is logged in.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/index.html'));
});

app.get('/get-cookie', (req, res) => {
    /**
     * Gets user cookie, has details about the user ID, user type, etc.
     */
    res.send(req.cookies);
});

app.get('/get-trans-forall-plm-lots/:accountNum', (req, res) => {
    /**
     * A route to send all transactions for all of the lots associated witb this account 
     * number.
     */
    const accountNum = parseInt(req.params.accountNum);
    dbInterface.getAllTransactionsForPLM(accountNum).then((transactions) => {
        res.status(200).send(transactions);
    }).catch((err) => {
        res.status(500).send(err);
    });
});

// Get PLM data routes.
app.get('/get-parking-lot-id/:acctNum', (req, res) => {
    const accountNum = parseInt(req.params.acctNum)
    dbInterface.getParkingLotByField("account_num", accountNum).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    })
})

app.get('/weekday-rates', (req, res) => {
    /**
     * Serves the weekday rates page to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_weekday.html'));
});

app.get('/weekend-rates', (req, res) => {
    /**
     * Serves the weekend rates page to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_weekend.html'));
});

app.get('/longterm-rates', (req, res) => {
    /**
     * Serves the longterm rates page to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_longterm.html'));
});

app.get('/special-rates', (req, res) => {
    /**
     * Serves the special rates to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_special.html'));
});

app.get('/pricing-default', (req, res) => {
    /**
     * Serves the pricing default page to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_default.html'));
});

app.get('/pricing-main', (req, res) => {
    /**
     * Serves the main pricing page to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_main.html'));
});

app.get('/logout', (req, res) => {
    /**
     * Logs out the user and destroys the cookie.
     */
    res.clearCookie("userData");
    res.status(200).send();
});

app.post('/authenticate', (req, res) => {
    /**
     * Authenticates the user given the email and password.
     * Accepts body data of the form {"user":{"email":string, "password":string}}
     */
    const user = req.body.user;
    let error;
    dbInterface.loginUser(user.email, user.password).then(result => {
        const userCookie = {
            email: result.value.email,
            accountNum: result.value.accountNum,
            acctType: result.value.accountType
        }
        res.cookie("userData", userCookie, { maxAge: 360000 });
        console.log("Login successful for " + result.value.email);
        res.status(200).send({ accountType: result.value.accountType });
    }).catch(err => {
        switch (err.status) {
            case 1:
                error = "Login failed with error: " + result.value;
                res.status(500).send({ error: error });
                break;
            case 2:
                error = "Email is not registered! Kindly sign up!";
                res.status(401).send({ error: error });
                break;
            case 3:
                error = "Account is not active!";
                res.status(400).send({ error: error });
                break;
            case 4:
                error = "Incorrect password! Please try again!";
                res.status(403).send({ error: error });
                break;
        }
    });
});

app.get('/dashboard', redirectIfLoggedOut, (req, res) => {
    /**
     * Serves dashboard to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/dashboard_user.html'));
})

app.get('/admin-dashboard', redirectIfLoggedOut, (req, res) => {
    /**
     * Serves admin dashboard to the administrator.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/dashboard-admin.html'));
})

app.get('/user-settings-page', redirectIfLoggedOut, (req, res) => {
    /**
     * serves the user settings page to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/user-settings.html"))
})

app.get('/plm-settings-page', redirectIfLoggedOut, (req, res) => {
    /**
     * Serves the plm settings page to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/plm-settings.html"))
})

app.get('/settings-page', redirectIfLoggedOut, (req, res) => {
    /**
     * Serves the settings page to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/settings.html"))
})

app.get('/admin-page', redirectIfLoggedOut, (req, res) => {
    /**
     * Serves the admin dashboard to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/dashboard_admin.html"))
})

app.get('/ban-form', redirectIfLoggedOut, (req, res) => {
    /**
     * Serves the ban form to the client.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/banform.html"))
})

app.get('/enter-lp-nums', (req, res) => {
    /**
     * This function sends the caller to the signup page for users meant to help them enter their license plate numbers
     * and in the future their payment info.
     */
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/signup_user.html"));
})

app.get('/enter-lot-data', (req, res) => {
    /**
     * This route sends the caller to the page in which they enter information about their parking lot. Meant for PLMs.
     */
    app.use(express.static("../frontend"));
    console.log("Sending the enter lot data file!");
    res.sendFile(path.resolve('../frontend/html/signup_plm.html'));
})

app.post('/new-user', (req, res) => {
    /**
     * Adds a new user to the database.
     */
    const newUser = req.body.newUser;
    dbInterface.addNewUser(newUser).then(response => {
        const userCookie = {
            email: response.value.email,
            accountNum: response.value.accountNum,
            acctType: newUser.accountType
        }
        res.cookie("userData", userCookie, { maxAge: 360000 }); // TODO: REMEMBER TO DESTROY AND RECREATE COOKIE FOR EMAIL WHEN THE USER CHANGES THEIR EMAIL THRU SETTINGS.
        res.status(200).send(response);
    }).catch(error => {
        switch (error.status) {
            case 1:
                console.log("Error in adding the new person.")
                res.status(500).send(error);
                break;
            case 2:
                console.log("Email is already registered")
                res.status(403).send(error.value);
                break;
            case 3:
                console.log("Phone number is already registered")
                res.status(403).send(error.value);
                break;
        }
    })
});

app.get('/search-acct-num/:acctNum', (req, res) => {
    /**
     * Searches for a user by account number 
     */
    const accountNum = req.params.acctNum;
    dbInterface.getUserByAccountNum(accountNum).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.get('/search-phone-num/:phoneNum', (req, res) => {
    /**
     * Searches for an account using phone number.
     */
    const phoneNum = req.params.phoneNum;
    dbInterface.getUserByPhone(phoneNum).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.get('/search-email/:email', (req, res) => {
    /**
     * Searches for an account using email.
     */
    const email = req.params.email;
    dbInterface.getUserByEmail(email).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.post('/add-license-plate', (req, res) => {
    /**
     * Adds the license plate of the user.
     * User can add up to two license plates.
     */
    const licensePlate = req.body.plate;
    const acctNum = req.body.acctNum;
    const secondLicensePlate = req.body.plateTwo;
    let errorCode;


    dbInterface.addLicensePlateNum(acctNum, licensePlate).then(result => {
        if (req.body.twoPlates) {
            return dbInterface.addLicensePlateNum(acctNum, secondLicensePlate);
        } else {
            res.status(200).send(result);
        }
    }).then(result => {
        res.status(200).send(result);
    }).catch(error => {
        errorCode = error.status;
    });
    switch (errorCode) {
        case 0:
            console.log("Success!");
            res.status(200).send("Success! Through route 0.");
            break;
        case -1:
            console.log(error.status, error.msg);
            res.status(500).send(error.msg);
            break;
        case -2:
            console.log(error.status, error.msg);
            res.status(401).send(error.msg);
            break;
        case -3:
            console.log(error.status, error.msg);
            res.status(403).send(error.msg);
            break;
        case -4:
            console.log(error.status, error.msg);
            res.status(404).send(error.msg);
            break;
        case -5:
            console.log(error.status, error.msg);
            res.status(400).send(error.msg);
            break;
    };
});

app.post('/add-parking-lot', (req, res) => {
    /**
     * Adds a new parking lot to the database. 
     */
    const accountNum = req.body.accountNum;
    const parkingLotInfo = req.body.parkingLotInfo;
    dbInterface.addParkingLot(accountNum, parkingLotInfo).then(output => {
        res.status(200).send({ result: output.value });
    }).catch(err => {
        log("There was an error when adding parking lot: ", err);
        res.status(500).send({ error: err.value });
    });
});

app.post('/add-transaction', (req, res) => {
    /**
     * Adds a new transaction to the database.
     */
    const accountNum = req.body.accountNum;
    const lotID = req.body.lotID;
    const timeEntered = req.body.timeEntered;
    const timeExit = req.body.timeExit;
    const cost = req.body.cost;
    if (dbInterface.addTransaction(accountNum, lotID, timeEntered, timeExit, cost) !== 0) {
        res.status(500).send();
    } else {
        res.status(200).send();
    }
});

app.get('/parking-pass-conflict', (req, res) => {
    /**
     * Checks for parking pass conflicts on the database, and reports results to the frontend.
     */
    const accountNum = req.body.accountNum;
    const lotID = req.body.lotID;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    //const cost = req.body.cost;
    dbInterface.checkConflictingPass(accountNum, lotID, startDate, endDate).then((conflict) => {
        if (conflict) {
            res.status(409).send("This proposed parking pass overlaps the parking pass that you already have in the database");
        }
        else {
            res.status(200).send("Ok");
        }
    })
})

app.get('/get-banned-users', (req, res) => {
    /**
     * Gets a list of all the banned users in the users database.
     */
    dbInterface.getBannedUsers("inactive-users")
    .then(result => res.status(200).send(result))
    .catch(error => res.status(500).send(error));
});

app.post('/add-parking-pass', (req, res) => {
    /**
     * Adds a parking pass for a specified account number. 
     */
    const accountNum = req.body.accountNum;
    const lotID = req.body.lotID;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const cost = req.body.cost;
    dbInterface.addParkingPass(accountNum, lotID, startDate, endDate, cost).then(result => {
        res.status(200).send(status);
    }).catch(error => {
        res.status(500).send(error);
    })
});

app.post('/add-parking-rate', (req, res) => {
    /**
     * Adds a parking rate for a given parking lot. 
     */
    const type = req.body.type;
    const params = req.body.params;

    dbInterface.addParkingRate(type, params)
    .then(dbOutput => {
        log("The db output is: ", dbOutput);
        res.status(200).send("Success.");
    }).catch((err) => {
        switch(err){
            case -1: 
                res.status(500).send("Error in adding the lot rate.");
                break;
            case -2: 
                res.status(409).send("The proposed rate conflicts with the existing rates for this parking lot");
                break;
            default:
                res.status(500).send("Major error in adding the lot rate.");
                break;
        }
        
    }) 
});

app.post('/update-pl-rate', (req, res) => {
    /**
     * Updates the parking lot rate, given the rateID and identification for the lots.
     */
    const rateID = req.body.rateID;
    const type = req.body.type;
    const params = req.body.params;
    dbInterface.updateParkingLotRate(rateID, type, params).then(result => {
        console.log(result);
        res.status(200).send("Parking Lot rates successfully updated.");
    }).catch(error => { res.status(500).send(error); });
});

app.post('/car-drives-up', (req, res) => {
    /**
     * Route to handle behavior when a car tries to enter a lot.
     * Expects to receive {"lpNum": <LPNUM>, "lotID": <LOTID>} as the req.body.
     */
    const lpNum = req.body.lpNum;
    const lotId = req.body.lotID;
    //NOTE: TO BE CHANGED TO 'searchForLpNum' fn when those things get merged! **********

    dbInterface.getParkingLotByField('lot_id', lotId)
        .then(lots => {
            console.log(lots);
            const currentLot = lots[0];
            if (currentLot.num_occupant === currentLot.capacity) {
                res.status(400).send("No more capacity!")
            }
            const newLotInfo = {
                capacity: currentLot.capacity,
                restriction: currentLot.restriction,
                description: currentLot.description,
                lot_name: currentLot.lot_name,
                num_occupant: currentLot.num_occupant + 1
            }
            return dbInterface.updateParkingLotByID(lotId, newLotInfo)
        }).then(result => {
            return dbInterface.getPlatesByField("license_num", lpNum)
        })
        .then((rows) => {
            const newTransaction = {
                lotId: lotId,
                accountNum: null,
                timeEntered: new Date()
            }
            if (rows.length > 0) {//user is pre-registered
                log("User is pre-registered");
                return handleRegisteredCustomer(rows, newTransaction);
            }
            else {
                log("User is not registered");
                return handleUnregisteredCustomer(newTransaction, lpNum);
            }

        }).then((newTransaction) => {
            return dbInterface.addTransaction(newTransaction["accountNum"], newTransaction["lotId"], newTransaction["timeEntered"]);
        }).then((statusCode) => {
            if (statusCode == 0) {
                res.status(200).send("New transaction added for car with license number " + lpNum);
            }
            else {
                res.status(500).send("Error when adding new transaction to db: " + statusCode);
            }
        }).catch((err) => {
            log("There was an error when processing a new car arrival ", err);
            res.status(500).send("There was an error when processing a new car arrival");
        })
})

function handleUnregisteredCustomer(cusArrivalInfo, lpNum) {
    /**
     * Given a struct representing info about the customer's arrival, such as 
     * {lotId: 253, accountNum: null, timeEntered: new Date()}, and a license plate number, this 
     * function handles the customer and returns a transaction struct to be added to the db.
     */
    return dbInterface.retrieveAndIncrementCounter("temp_email_counter", "emailCounterQuery").then((counterVal) => {
        const tempEmail = 'TEMPORARY_ACCOUNT' + counterVal + '@TEMP.COM';
        return { email: tempEmail };
    }).then((userSoFar) => {
        return dbInterface.retrieveAndIncrementCounter("temp_phone_counter", "phoneCounterQuery").then((counterVal) => {
            userSoFar["phoneNum"] = counterVal;
            return userSoFar;
        }).catch((err) => {
            return Promise.reject(err);
        })
    }).then((userSoFar) => {
        userSoFar["password"] = 'password123';
        userSoFar["firstName"] = "TEMP_";
        userSoFar["lastName"] = "ACCOUNT_";
        userSoFar["accountType"] = "user";
        return userSoFar;
    }).then((userStruct) => {
        return dbInterface.addNewUser(userStruct);
    }).then((result) => {
        return result.value.accountNum;
    }).then((accountNum) => {
        cusArrivalInfo["accountNum"] = accountNum;
        return dbInterface.addLicensePlateNum(accountNum, lpNum);
    }).then((result) => {
        return cusArrivalInfo;
    }).catch((err) => {
        log("There was an error when handling unregistered customer ");
        return Promise.reject(err);
    })

}

function handleRegisteredCustomer(rowsWithLpNum, cusArrivalInfo) {
    /**
     * Given a row matching the customer's license plate e.g. {account_num: 100007, license_num: 'AUDI123'}, and a struct 
     * representing info about the customer's arrival, such as {lotId: 253, accountNum: 100007, timeEntered: new Date()}, this
     * function handles the customer and returns a transaction struct to be added to the db
     */
    if (rowsWithLpNum.length > 1) {
        log("This lpNumber appears more than once in the license plate table!");
    }
    cusArrivalInfo["accountNum"] = rowsWithLpNum[0].account_num;
    return cusArrivalInfo;
}


app.post('/remove-lp-num', (req, res) => {
    /**
     * Removes a license plate from the database.
     */
    const lpNum = req.body.lpNum
    dbInterface.deleteLPNumByField('license_num', lpNum).then(result => {
        res.status(200).send(`Removal of License Plate number ${lpNum} complete.`);
    }).catch(error => { res.status(500).send(`Error when removing ${lpNum} :${error}`) });
});

app.get('/get-user-transactions/:acctNum', (req, res) => {
    /**
     * Gets all the transactions for a user with a given account number.
     */
    const accountNum = req.params.acctNum;
    dbInterface.getTransactionsByField('account_num', accountNum, false).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.get('/get-lot-name/:lotId', (req, res) => {
    /**
     * Gets the lot name for a specified lot ID.
     */
    dbInterface.getParkingLotByField("lot_id", req.params.lotId)
        .then( info => {
            req.status(200).send(info);
        }).catch(error => {
        res.status(500).send(error);
    });

});

app.get('/get-plm-transactions/:lotId', (req, res) => {
    /**
     * Gets all the PLM transactions for a given lotID.
     */
    const lotId = req.params.lotId;
    dbInterface.getTransactionsByField('lot_id', lotId, false).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.post('/prep-leaving-car', (req, res) => {
    /**
     * Prepares the system for a car leaving the database. 
     * Requires data of the form {"lpNum":string, "lotID":int}
     */
    const data = req.body;
    dbInterface.getPlatesByField("license_num", data.lpNum).then((account) => {
        console.log("The lpRow with the plate is: ", account);
        if (account === null) { res.status(500).send("Error, license plate doesn't exist.") }
        const accountNum = account[0].account_num;
        // search for the in-progress transaction
        return dbInterface.getTransactionsByField("account_num", accountNum, true);
    })
        .then(transactions => {
            log("The transactions are: ");
            log(transactions);
            const costToPay = 10; // HERE PUT THE REAL FARE CALCULATION.
            res.status(200).send(JSON.stringify(costToPay));
        })
        .catch((error) => {
            log("There was an error, ", error);
            res.status(500).send(error)
        });
});
app.post('/get-parking-rate-by-field', (req, res) => {
    /**
     * Expects data in the format {"type":int, "field":string, "value":string/int}
     * Type has to be in the range [1, 4], each corresponding to a differnt kind of rate.
     * 1 = weekday, 2 = weekend, 3 = longterm, 4 = special.
     */
    const data = req.body;
    dbInterface.getParkingRatesByField(data.type, data.field, data.value)
        .then(value => {
            res.status(200).send(value);
        })
        .catch(error => {
            res.status(500).send(error);
        });
});

app.post('/completed-payment', (req, res) => {
    /**
     * Assumes a completed transaction, and updates values in the database. 
     * Takes data of the form {"payment": payment object, "lotID": int, "account_num": int}
     */
    const data = req.body;
    // search for incomplete transaction
    console.log(data.account_num);
    const lotID = data.lotID;

    dbInterface.getParkingLotByField('lot_id', lotID)
        .then(lots => {
            console.log(lots);
            const currentLot = lots[0];
            const newLotInfo = {
                capacity: currentLot.capacity,
                restriction: currentLot.restriction,
                description: currentLot.description,
                lot_name: currentLot.lot_name,
                num_occupant: currentLot.num_occupant - 1
            }
            return dbInterface.updateParkingLotByID(lotID, newLotInfo)
        })
        .then(result => {
            return dbInterface.getTransactionsByField("account_num", data.account_num)
        })
        .then(transactions => {
            // should be transactions[0] that has an incomplete transaction, since at any time there should only be one such transaction.
            transactions = transactions.sort((a, b) => {
                return (a.time_entered - b.time_entered) * -1;
            });
            console.log(transactions)
            const currentTransaction = transactions[0];
            currentTransaction.time_exited = data.payment.time_exited; currentTransaction.cost = 10; //  for now
            return Promise.all([dbInterface.updateTransactionsByField('trans_id', currentTransaction.trans_id,
                { time_exited: data.payment.time_exited, cost: 10 }), currentTransaction.account_num]);
        })
        .then((items) => {
            const accountNum = items[1];
            log("The accountNum is: ", accountNum);
            return Promise.all([dbInterface.getUserByAccountNum(accountNum), accountNum]);
        })
        .then(items => {
            const user = items[0];
            const accountNum = items[1];
            log("The user object is: ", user);
            if (user.phone_num < 0) { // CHECK TEMP USER
                log("There is a temp user");
                return Promise.all([dbInterface.deleteLPNumByField('account_num', accountNum), accountNum]);
            } else {
                log("There is a registered user ");
                return Promise.all([0, accountNum]);
            }
        })
        .then(items => {
            const result = items[0];
            const accountNum = items[1];
            if (result !== 0) {
                log("delete lpNums had an error.");
                return -1;
                //return dbInterface.deleteUserByField('account_num', accountNum);
            } else { return 0 }
        })
        .then(result => {
            if (result == 0) { res.status(200).send("Ok") }
            else { res.status(500).send("An error occurred") };
        })
        .catch(error => {
            log("There was an error: ", error);
            res.status(500).send(error);
        });
});

app.post('/update-account-details', (req, res) => {
    /**
     * This is a route to update the first name, last name and phone_number of a user.
     * Expects data of the form {accountNum: int, newFirst: string, newLast: string, newPhone: int, newEmail: string}
     * If the user only wants to update one of these, the rest of those fields are the same as before.
     * This will be managed by the frontend.
     */
    const newDetails = req.body;
    const newUser = {
        first_name: newDetails.newFirst,
        last_name: newDetails.newLast,
        email: newDetails.newEmail,
        phone_num: newDetails.newPhone
    }
    dbInterface.getUserByAccountNum(newDetails.accountNum)
        .then(user => {
            const userCookie = {
                email: newUser.email,
                accountNum: newDetails.accountNum,
                acctType: user.type
            }
            res.cookie("userData", userCookie, { maxAge: 360000 });
            return dbInterface.updateUserByField('account_num', newDetails.accountNum, newUser);
        })
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error);
        });
});

app.post('/update-lp', (req, res) => {
    /**
     * A route to update the license plates of a given user.
     * Expects data in the form {accountNum: int, firstPlate: string, secondPlate: string}
     */
    const data = req.body;
    const newLP = {
        plateOne: data.firstPlate,
        plateTwo: data.secondPlate
    }
    dbInterface.updateLPByAccountNum(data.accountNum, newLP)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error);
        })
});

app.get('/delete-parking-lot/:lotId', (req, res) => {
    /**
     * A route to delete the parking lot, given the lotID
     */
    const lotId = req.params.lotID;
    dbInterface.deleteParkingLotById(lotId)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error);
        });
});

app.get('/get-license-plate/:acctNum', (req, res) => {
    /**
     * A function to get the associated license plates by the account number. 
     */
    const acctNum = req.params.acctNum;
    dbInterface.getPlatesByField('account_num', acctNum)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error);
        })
});

app.post('/update-pl', (req, res) => {
    /**
     * A function to update the parking lot's information.
     * Expects data in the format 
     * {
     *  lotID:int,
     *  newCapacity: int, 
     *  newRestriction: string,
     *  newDescription: string,
     *  newName: string
     * }
     * When some part of the information is unchanged, it is re-entered by the frontend as the same as it was before.
     * Managed by the frontend.
     */
    const data = req.body;
    const newLotInfo = {
        capacity: parseInt(data.newCapacity),
        restriction: data.newRestriction,
        description: data.newDescription,
        lot_name: data.newName,
        num_occupant: 10
    };
    dbInterface.updateParkingLotByID(data.lotID, newLotInfo)
        .then(result => {
            res.status(200).send(result);
            app.post('/get-passes-by-field', (req, res) => {
                /**
                 * Expects data in the format {"field":string, "value":string/int}
                 * NOTE: field is one of: ["pass_id", "account_num", "lot_id", "start_date", "end_date", "cost"]. Any other values will 
                 * throw an error!
                 */
                const data = req.body;
                dbInterface.getPassesByField(data.field, data.value)
                    .then(value => {
                        res.status(200).send(value);
                    })
                    .catch(error => {
                        res.status(500).send(error);
                    });
            })
        })
});


app.post('/set-timeslot-cookie', (req, res) => {
    /**
     * Sets the timeslot cookie for help with plm signups
     */
    const data = req.body;
    const timeslotCookie = {
        day: data.day,
        evening: data.evening
    }
    res.cookie("timeslotCookie", timeslotCookie, { maxAge: 360000 });
    res.status(200).send()
});

app.get('/increment-occupancy/:lotID', (req, res) => {
    /**
     * Increments lot occupancy when a car enters.
     */
    const lotID = req.params.lotID;
    dbInterface.getParkingLotByField('lot_id', lotID)
        .then(lots => {
            console.log(lots);
            const currentLot = lots[0];
            if (currentLot.num_occupant === currentLot.capacity) {
                res.status(400).send("No more capacity!")
            }
            const newLotInfo = {
                capacity: currentLot.capacity,
                restriction: currentLot.restriction,
                description: currentLot.description,
                lot_name: currentLot.lot_name,
                num_occupant: currentLot.num_occupant + 1
            }
            return dbInterface.updateParkingLotByID(lotID, newLotInfo)
        })
        .then(result => res.status(200).send(result))
        .catch(error => res.status(500).send(error));
});

app.get('/decrement-occupancy/:lotID', (req, res) => {
    /**
     * Decrements lot occupancy when a car exits.
     */
    const lotID = req.params.lotID;
    dbInterface.getParkingLotByField('lot_id', lotID)
        .then(lots => {
            console.log(lots);
            const currentLot = lots[0];
            const newLotInfo = {
                capacity: currentLot.capacity,
                restriction: currentLot.restriction,
                description: currentLot.description,
                lot_name: currentLot.lot_name,
                num_occupant: currentLot.num_occupant - 1
            }
            return dbInterface.updateParkingLotByID(lotID, newLotInfo)
        })
        .then(result => res.status(200).send(result))
        .catch(error => res.status(500).send(error));
});

app.get('/update-pw/:newPW', (req, res) => {
    /**
     * Updates the password, given a new password. 
     */
    const newPassword = req.params.newPW;
    console.log(req.cookies)
    const userID = req.cookies.userData.accountNum;
    console.log(userID);
    dbInterface.updatePW(userID, newPassword)
    .then(result => res.status(200).send(result))
    .catch(error => res.status(500).send(error));
});

app.get('/ban-user/:userID', (req, res) => {
    /**
     * Bans the user, given a userID.
     */
    const userID = req.params.userID;
    console.log(userID);
    dbInterface.setUserActive(userID, false)
    .then(resp => {
        if (resp == 0) {res.status(200).send()}
    })
    .catch(error => {
        switch(error){
            case -1: 
                res.status(400).send(JSON.stringify(error));
                break;
            case -2: 
                res.status(401).send(JSON.stringify(error));
                break;
            default: 
                res.status(500).send("Unknown error when banning a user.");
                break;
        }
    });
});

app.get('/unban-user/:userID', (req, res) => {
    /**
     * Unbans the user, given a UserID.
     */
    const userID = req.params.userID;
    console.log(userID);
    dbInterface.setUserActive(userID, true)
    .then(resp => {
        if (resp == 0) {res.status(200).send()}
    })
    .catch(error => {
        switch(error){
            case -1: 
                res.status(400).send(JSON.stringify(error));
                break;
            case -2: 
                res.status(401).send(JSON.stringify(error));
                break;
            default: 
                res.status(500).send("Unknown error.");
                break;
        }
    });
})

app.post('/resolve-add-lot-req', (req, res) => {
    /**
     * Resolve the request to add a new lot.
     * The request format is like the following example:
     * {"request": {
            req_id: 100021,
            from_acc: 100013,
            to_acc: 100,
            type: 'parking lot request',
            title: '334',
            related_acc: null,
            description: '',
            resolved: false,
            add_date: "2020-04-05T04:00:00.000Z",
            update_date: "2020-04-05T04:00:00.000Z"
        }
     */
    const request = req.body.request;
    dbInterface.resolveAddLotRequest(request)
    .then(result => res.status(200).send({"message": "Request was resolved. Result: ", result}))
    .catch(err => res.status(500).send({"message": "Error occurred. Error: ", err}));
});

app.post('/get-type-reqs-for-timerange', (req, res) => {
    /**
     * Get requests from a specific PLM for a given time frame.
     * The object sent in the req.body is of the form:
     * {
     *      "type": str,
     *      "startTime": time object,
     *      "endTime": time object
     * }
     */
    const type = req.body.type;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    dbInterface.getRequestsForTimeRange({'type': type}, startTime, endTime)
    .then(result => res.status(200).send(result))
    .catch(err => res.status(500).send(err));
});

app.post('/get-plm-requests-for-timerange', (req, res) => {
    /**
     * Get requests from a specific PLM for a given time frame.
     * The object sent in the req.body is of the form:
     * {
     *      "plmID": int,
     *      "startTime": time object,
     *      "endTime": time object
     * }
     */
    const plmUserID = req.body.plmID;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    dbInterface.getRequestsForTimeRange({'from_acc': plmUserID}, startTime, endTime)
    .then(result => res.status(200).send(result))
    .catch(error => res.status(500).send(error));
});

app.post('/get-reqs-of-type', (req, res) => {
    /**
     * Gets all requests of a specified type.
     */
    const type = req.body.type;
    dbInterface.getRequestsByField({'type': type}, "getRequestsByType")
    .then(result => res.status(200).send(result))
    .catch(error => res.status(500).send(error));
});

app.get('/get-plm-requests/:plmID', (req, res) => {
    /**
     * Gets the requests submitted by the PLM plmID.
     */
    const plmID = parseInt(req.params.plmID);
    dbInterface.getRequestsByField({'from_acc': plmID}, "getRequestsByFromAcc")
    .then(result => {
        res.status(200).send(result);
    })
    .catch(error => {
        res.status(500).send(error);
    });
});

app.post('/resolve-bug-request', (req, res) => {
    /**
     * The request format for this function should be like the following example:
     * {"request": {
            req_id: 100001,
            from_acc: 100171,
            to_acc: 100,
            type: 'bug report',
            title: 'Vidbugs',
            related_acc: null,
            description: 'veg ftw',
            resolved: true,
            add_date: "2020-04-04T04:00:00.000Z",
            update_date: "2020-04-04T04:00:00.000Z"
        }
     */
    const request = req.body.request;
    dbInterface.resolveBugRequest(request)
    .then(result => res.status(200).send(result))
    .catch(error => {
        switch(error){
            case 1:
                res.status(500).send("Error resolving bug request. Code: ", error);
                break;
            case 2:
                res.status(400).send("Invalid request format. Code: ", error);
                break;
            default:
                res.status(500).send("Other error in the server. Code: ", error);
                break;
        }
    });
});

app.get('/delete-req/:reqID', (req, res) => {
    /**
     * Deletes requests, given a requestID.
     */
    const reqID = req.params.reqID;
    dbInterface.deleteRequest(reqID)
    .then(result => res.status(200).send("Deleted the request. Result: ", result))
    .catch(error => res.status(500).send("Error occurred while deleting the request. Error: ", error));
});

app.post('/approve-ban-req', (req, res) => {
    /**
     * Given a request object, will approve ban request.
     * The request object is the form of the following example:
     * {"request": {
            req_id: 100005,
            from_acc: 100013,
            to_acc: 100,
            type: 'ban request',
            title: 'meat',
            related_acc: 100013,
            description: 'veg ftw',
            resolved: true,
            add_date: "2020-04-04T04:00:00.000Z",
            update_date: "2020-04-04T04:00:00.000Z"
        }}
     */
    const request = req.body.request;
    dbInterface.approveBanRequest(request)
    .then(result => res.status(200).send(JSON.stringify(0)))
    .catch((error) => {
        if (error == 1) {
            res.status(400).send(JSON.stringify({error: "This user has already been banned!"}));
        }
        else {
            res.status(500).send(JSON.stringify({error: "Error occurred. Message: "+ error}));
        }
    });
});

app.post('/approve-other-req', (req, res) => {
    /**
     * Approves requests of type "other".
     * The request object sent must have the format of the following example:
     * {"request":{
            req_id: 100001,
            from_acc: 100171,
            to_acc: 100,
            type: 'other',
            title: 'Vidbugs',
            related_acc: null,
            description: 'veg ftw',
            resolved: true,
            add_date: "2020-04-04T04:00:00.000Z",
            update_date: "2020-04-04T04:00:00.000Z"
        }}
     */
    const request = req.body.request;
    dbInterface.resolveOtherRequest(request)
    .then(result => res.status(200).send(result))
    .catch(error => {
        switch(error){
            case 1:
                res.status(500).send("An error occurred while trying to resolve requests.");
                break;
            case 2:
                res.status(400).send("An error occurred: Request is not of type 'other'.");
                break;
            default:
                res.status(500).send("An error occurred. Unknown Error.")
                break;
        }
    });
});

app.get('/get-notifs-for/:acctID', (req, res) => {
    /**
     * Gets the notifications for a given user, filtered on the frontend.
     */
    const accountID = req.params.acctID;
    dbInterface.getRequestsByField({"to_acct": accountID}, "getRequestsByToAccount")
    .then(result => res.status(200).send(result))
    .catch(error => {
        switch(error){
            case 1:
                res.status(400).send("An error occurred when getting notifications. Error: ", error);
                break;
            case 2:
                res.status(500).send("Invalid request. Error: ", error);
                break;
            default:
                res.status(500).send("Unknown error. Error: ", error);
                break;
        }
    });
});

app.post('/add-pp', (req, res) => {
    /**
     * Adds a parking pass to the specified user. The input object must be of the format:
     * {"userID": int, "lotID": int, "startDate": date object, "endDate": date object, "cost": int}
     */
    const userID = req.body.userID;
    const lotID = req.body.lotID;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const cost = req.body.cost;
    dbInterface.addParkingPass(userID, lotID, startDate, endDate, cost)
    .then(result => {
        res.status(200).send(result);
    })
    .catch(error => {
        res.status(500).send(error);
    });
});

app.post('/remove-pp', (req, res) => {
    /**
     * Removes the parking pass for the given userID.
     * Assumes only one parking pass at a time per user.
     */
    const userID = req.body.userID;
    const lotID = req.body.lotID;
    dbInterface.removeParkingPass(userID, lotID)
    .then(result => res.status(200).send(result))
    .catch(error => res.status(500).send(error));
});

app.get('/get-req-by-reqid/:reqID', (req, res) => {
    /**
     * Gets the request given a request ID.
     */
    const reqID = req.params.reqID;
    dbInterface.getRequestsByField({"req_id": reqID}, "getRequestsByReqID")
    .then((result) => {
        //log("THe resutl of getting a request by reqid is: ", result);
        //log("THe result[0] is then: ", result[0]);
        if (result == []){
            res.status(200).send(JSON.stringify("There is no such request by this number!"))
        }
        res.status(200).send(JSON.stringify(result[0]))
    })
    .catch(error => res.status(500).send(JSON.stringify(error)));
});

app.post('/modify-pp', (req, res) => {
     /**
     * Modifies a parking pass to the specified user. The input object must be of the format:
     * {"userID": int, "lotID": int, "startDate": date object, "endDate": date object, "cost": int}
     * Assumes a single parking pass per user per lot, running at a time - i.e. user does not have multiple parking
     * passes for one lot at the same time.
     */
    const userID = req.body.userID;
    const lotID = req.body.lotID;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const cost = req.body.cost;
    dbInterface.modifyParkingPass(userID, lotID, startDate, endDate, cost)
    .then(result => res.status(200).send(result))
    .catch(error => res.status(500).send(error));
});

app.post('/send-request', (req, res) => {
    /**
     * A function that sends a request to the admin from a PLM account.
     * req.body has the following structure:
     * {"request":{"fromAcc": str, "description": str, "toAcc": int, "relatedAcc": int, "type": str, "title": str}}
     */
    const request = req.body.request;
    const fromAcc = request.fromAcc;
    const toAcc = request.toAcc;
    const type = request.type;
    const title = request.title;
    const relatedAcc = request.relatedAcc;
    const description = request.description;
    dbInterface.addRequest(fromAcc, toAcc, type, title, relatedAcc, description)
    .then(result => {
        if (result.code === 0) {res.status(200).send(result.reqID);}
        else {res.status(201).send(result.reqID);}
    })
    .catch(error => {
        switch(error.code){
            case -1:
                res.status(404).send(error.msg);
                break;
            case -2:
                res.status(400).send(error.msg);
                break;
            case -3:
                res.status(500).send(error.msg);
                break;
            default:
                res.status(501).send("Unknown error");
                break;
        }
    });
});

module.exports = app;

app.listen(port, () => {
    console.log(`Server is running on port ${port}...`)
});
