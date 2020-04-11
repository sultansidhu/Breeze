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
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/index.html'));
});

app.get('/get-cookie', (req, res) => {
    res.send(req.cookies);
});

app.get('/get-trans-forall-plm-lots/:accountNum', (req, res) => {
    /**
     * A route to send all transactions for all of the lots associated witb this account 
     * number.
     */
    log("Reached here!");
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
    console.log("INSING ROUTE: ACCOUNT NUM IS " + accountNum)
    dbInterface.getParkingLotByField("account_num", accountNum).then(user => {
        console.log("INSIDE THE THEN: " + user)
        res.status(200).send(user);
    }).catch(error => {
        console.log("INSIDE THE CATCG: " + error)
        res.status(500).send(error);
    })
})

app.get('/weekday-rates', (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_weekday.html'));
});

app.get('/weekend-rates', (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_weekend.html'));
});

app.get('/longterm-rates', (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_longterm.html'));
});

app.get('/special-rates', (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_special.html'));
});

app.get('/pricing-timeslot', (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_timeslot.html'));
});

app.get('/pricing-main', (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/pricing_main.html'));
});

app.get('/logout', (req, res) => {
    res.clearCookie("userData");
    res.status(200).send();
});

app.post('/authenticate', (req, res) => {
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
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve('../frontend/html/dashboard_user.html'));
})

app.get('/user-settings-page', redirectIfLoggedOut, (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/user-settings.html"))
})

app.get('/plm-settings-page', redirectIfLoggedOut, (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/plm-settings.html"))
})

app.get('/settings-page', redirectIfLoggedOut, (req, res) => {
    app.use(express.static("../frontend"));
    res.sendFile(path.resolve("../frontend/html/settings.html"))
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
    const accountNum = req.params.acctNum;
    dbInterface.getUserByAccountNum(accountNum).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.get('/search-phone-num/:phoneNum', (req, res) => {
    const phoneNum = req.params.phoneNum;
    dbInterface.getUserByPhone(phoneNum).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.get('/search-email/:email', (req, res) => {
    const email = req.params.email;
    dbInterface.getUserByEmail(email).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.post('/add-license-plate', (req, res) => {
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

app.post('/add-parking-pass', (req, res) => {
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
    const type = req.body.type;
    const params = req.body.params;
    console.log("type is : " + type)
    console.dir(params)

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
        }
        res.status(500).send("Major error in adding the lot rate.");
    }) 
});

app.post('/update-pl-rate', (req, res) => {
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
    const lpNum = req.body.lpNum
    dbInterface.deleteLPNumByField('license_num', lpNum).then(result => {
        res.status(200).send(`Removal of License Plate number ${lpNum} complete.`);
    }).catch(error => { res.status(500).send(`Error when removing ${lpNum} :${error}`) });
});

app.get('/get-user-transactions/:acctNum', (req, res) => {
    const accountNum = req.params.acctNum;
    dbInterface.getTransactionsByField('account_num', accountNum, false).then(user => {
        res.status(200).send(user);
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.get('/get-lot-name/:lotId', (req, res) => {
    dbInterface.getParkingLotByField("lot_id", req.params.lotId)
        .then( info => {
            req.status(200).send(info);
        }).catch(error => {
        res.status(500).send(error);
    });

});

app.get('/get-plm-transactions/:lotId', (req, res) => {
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
    const data = req.body;
    const timeslotCookie = {
        day: data.day,
        evening: data.evening
    }
    res.cookie("timeslotCookie", timeslotCookie, { maxAge: 360000 });
    res.status(200).send()
});

app.get('/increment-occupancy/:lotID', (req, res) => {
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
    const newPassword = req.params.newPW;
    console.log(req.cookies)
    const userID = req.cookies.userData.accountNum;
    console.log(userID);
    dbInterface.updatePW(userID, newPassword)
    .then(result => res.status(200).send(result))
    .catch(error => res.status(500).send(error));
});

module.exports = app;

app.listen(port, () => {
    console.log(`Server is running on port ${port}...`)
});
