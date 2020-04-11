const db = require('./db_conn_client/db_connector')
const bcrypt = require('bcrypt')
const log = console.log;

// db.pool.end(() => {
//     //log('pool has ended')
// })

////////////////////////////HELPERS///////////////////////////////////////////////////////////////////////////////////////////

//Helper function to make the db query asyncronously; do not call directly.
const getUserHelper = (userQuery, client) => {
    return client.query(userQuery).then((res) => {
        client.release();
        if (res.rows.length == 1) {
            return res.rows[0];
        }
        else if (res.rows.length > 1) {
            //log("ERROR: MULTIPLE USERS MAY HAVE THE SAME ACCOUNT NUMBER....", res.rows);
            return res.rows[0];
        }
        else {
            //log("There does not appear to be a user with the specified account number");
            return null;
        }
    }).catch((err) => {
        //log("There was an error when connecting an accountNumber to user data: ", err)
        return null;
    });
}

const hashPassword = (password) => {
    return bcrypt.hash(password, 10).then((hash) => {
        return hash;
    }).catch((err) => {
        log("Error when hashing the pw: ", err);
    })
}

const comparePasswords = (hash, password) => {
    bcrypt.compare(password, hash, (err, res) => {
        if (res) return true;
        if (err) console.log(err);
        return false;
    })
}

const isLetter = (c) => {
    return c.toLowerCase() !== c.toUpperCase();
}

const isLowerCase = (c) => {
    return c.toLowerCase() === c;
}

const respondWith = (client, status, value, response) => {
    client.release()
    response({ status: status, value: value })
}

const checkOverlappingTimeRanges = (startTime1, endTime1, startTime2, endTime2) => {
    /**
     * Given two sets of times, this function checks if the time ranges are overlapping, and returns true if so, or 
     * false if not overlapping.
     * e.g. overlappingTimeRanges("06:00:00", "18:00:00", "18:00:00", "06:00:00") returns false;
     * overlappingTimeRanges("18:00:00", "19:01:00", "06:00:00", "19:00:00"); returns true;
     * overlappingTimeRanges("18:00:00", "19:00:00", "06:00:00", "18:00:00"); returns false;
     * overlappingTimeRanges("18:00:00", "19:00:00", "06:00:00", "18:00:01"); returns true;
     * overlappingTimeRanges("06:00:00", "18:00:00", "19:00:00", "05:00:00"); returns false;
     * overlappingTimeRanges("06:00:00", "18:00:00", "18:00:00", "06:00:01"); returns true;
     * overlappingTimeRanges("17:00:00", "06:00:00", "06:00:00", "18:00:00"); returns true
     */
    const startDate1 = new Date("December 11, 2000 " + startTime1);
    //log(startDate1);
    const startDate2 = new Date("December 11, 2000 " + startTime2);
    //log(startDate2);
    const endDate1 = new Date("December 11, 2000 " + endTime1);
    //log(endDate1);
    const endDate2 = new Date("December 11, 2000 " + endTime2);
    //log(endDate2);
    //new Date(year, month, day, hours, minutes, seconds, milliseconds)
    if (startDate1 <= endDate1 && startDate2 <= endDate2) {//Two daytime time ranges
        return (startDate1 >= startDate2 && startDate1 < endDate2) || (endDate1 > startDate2 && endDate1 <= endDate2);
    }
    else if (startDate1 >= endDate1 && startDate2 >= endDate2) {//Two overnight time ranges
        return true; //Since all rates that go overnight have to cross over the 23:59:59 range, all
        //overnight ranges overlap
    }
    else if (startDate2 >= endDate2) {//Case where time range 2 is overnight, but time range 1 is not.
        return (endDate2 > startDate1 || endDate1 > startDate2);
    }
    else if (startDate1 >= endDate1) {//Case where time range 1 is overnight, but time range 2 is not.
        return (endDate1 > startDate2 || endDate2 > startDate1);
    }
    else {
        log("An unexpected error occurred when checking for time range overlapping...");
        return false;
    }
}

const checkConflictingRates = (type, params) => {
    /**
     * Given a proposed parking entry in one of the tables, this function checks the database to see if there is a conflict; i.e.
     * is there already a parking rate in the table with the exact same times, and the same timerange with same/different rates
     * as the proposed? If so, this function returns TRUE. If no conflict, return FALSE.
     * Note: The params list should be ordered properly. See tableQueries in addParkingRate to check proper order depending which
     * table you are inserting
     * e.g checkConflictingRates(1,  { lot_id: 219, mon: true, tues: true, wed: false, thurs: true,
     *  fri: true, time_length: 30, cost: 4, start_time: "06:00:00", end_time: "18:00:00"})
     */
    let table;
    let func;
    switch (type) {
        case 1:
            table = "LotRateWeekday";
            func = conflictingRatesWeekday;
            break;
        case 2:
            table = "LotRateWeekend";
            func = conflictingRatesWeekend;
            break;
        case 3:
            table = "LotRateLongterm";
            func = conflictingRatesLongterm;
            break;
        case 4:
            table = "LotRateSpecial";
            func = conflictingRatesSpecial;
            break;
    }
    return db.pool.connect().then((client) => {
        const retrieveQuery = {
            name: "retrieveQuery",
            text: 'SELECT * FROM "BreezeParking"."' + table + '" WHERE lot_id = $1',
            values: [params.lot_id]
        }
        return client.query(retrieveQuery);
    }).then((result) => {
        return result.rows; //Returns the actual items
    }).then((entries) => {
        return func(params, entries);
        ////log("The entries are: ", entries);
        //return false;
    }).catch((err) => {
        //log('There was an error when checking for rate conflicts ', err);
        return true;
    })
}

const conflictingRatesSpecial = (proposedRate, lotEntries) => {
    /**
     * This function specifically checks the given special rates in the lotEntries list of structs to see if they conflict with
     * the struct proposedRate. Helper function. Returns whether there is a conflict (true) or not (false)
     */
    ////log("Date proposed rate is ", new Date(proposedRate.day));
    ////log("First lot entry's date is, ", new Date(lotEntries[0].day).getFullYear());
    ////log("lotEntries are ", lotEntries);
    ////log("proposedRate is ", proposedRate);
    const filteredByDayAndLength = lotEntries.filter((entry) => {
        const proposedYear = new Date(proposedRate.day).getFullYear();
        const proposedMonth = new Date(proposedRate.day).getMonth();
        const proposedDay = new Date(proposedRate.day).getDate();
        const entryYear = new Date(entry.day).getFullYear();
        const entryMonth = new Date(entry.day).getMonth();
        const entryDay = new Date(entry.day).getDate();
        ////log(proposedYear, entryYear, proposedMonth, entryMonth, proposedDay, entryDay);
        return proposedYear == entryYear && proposedMonth == entryMonth && proposedRate.time_length == entry.time_length
            && proposedDay == entryDay - 1;
        //There is an of by one error for some reason
    });
    const filteredByTime = filteredByDayAndLength.filter((entry) => {
        return checkOverlappingTimeRanges(proposedRate.start_time, proposedRate.end_time, entry.start_time, entry.end_time);
    });
    return !(filteredByTime.length == 0);
}

const conflictingRatesLongterm = (proposedRate, lotEntries) => {
    /**
     * This function specifically checks the given longterm rates in the lotEntries list of structs to see if they conflict with
     * the struct proposedRate. Helper function. Returns whether there is a conflict (true) or not (false)
     */
    const filteredByLength = lotEntries.filter((entry) => {
        return proposedRate.day_length == entry.day_length;
    });
    return !(filteredByLength.length == 0);
}

const conflictingRatesWeekend = (proposedRate, lotEntries) => {
    /**
     * This function specifically checks the given weekend rates in the lotEntries list of structs to see if they conflict with
     * the struct proposedRate. Helper function. Returns whether there is a conflict (true) or not (false)
     */
    const filteredByDay = lotEntries.filter((entry) => {
        return (entry.sat && proposedRate.sat) || (proposedRate.sun && entry.sun);
    });
    log("Filtered by day is: ", filteredByDay);
    const filteredByDayAndLength = filteredByDay.filter((entry) => {
        return proposedRate.time_length == entry.time_length;
    });
    log("Filtered by day and length is: ", filteredByDayAndLength);
    const filteredByTime = filteredByDayAndLength.filter((entry) => {
        return checkOverlappingTimeRanges(proposedRate.start_time, proposedRate.end_time, entry.start_time, entry.end_time);
    });
    log("ProposedRate is: ", proposedRate);
    log("Filtered by time is: ", filteredByTime);
    return !(filteredByTime.length == 0);
}

const conflictingRatesWeekday = (proposedRate, lotEntries) => {
    /**
     * This function specifically checks the given weekday rates in the lotEntries list of structs to see if they conflict with
     * the struct proposedRate. Helper function. REturns whether there is a conflict (true) or not (false)
     */
    const filteredByDay = lotEntries.filter((entry) => {
        return (entry.mon && proposedRate.mon) || (entry.tues && proposedRate.tues) || (entry.wed && proposedRate.wed) ||
            (entry.thurs && proposedRate.thurs) || (entry.fri && proposedRate.fri);
    });
    log("Filtered by day is: ", filteredByDay);
    const filteredByDayAndLength = filteredByDay.filter((entry) => {
        return proposedRate.time_length == entry.time_length;
    });
    log("Filtered by day and length is: ", filteredByDayAndLength);
    const filteredByTime = filteredByDayAndLength.filter((entry) => {
        return checkOverlappingTimeRanges(proposedRate.start_time, proposedRate.end_time, entry.start_time, entry.end_time);
    });
    log("ProposedRate is: ", proposedRate);
    log("Filtered by time is: ", filteredByTime);
    return !(filteredByTime.length == 0);
}

const checkParkingRateParams = (type, field) => {
    /**
     * Given a lot type and the name of the field, this function returns whether the field is valid TRUE or invalid FALSE
     */
    const validFieldsByType = {
        1: ["rate_id", "mon", "tues", "wed", "thurs", "fri", "time_length", "cost", "lot_id", "start_time", "end_time"],
        2: ["rate_id", "sat", "sun", "time_length", "cost", "lot_id", "start_time", "end_time"],
        3: ["rate_id", "cost", "lot_id", "day_length"],
        4: ["rate_id", "day", "time_length", "cost", "lot_id", "start_time", "end_time"]
    }
    if ([1, 2, 3, 4].indexOf(type) < 0) {
        //log("You must enter in a valid type, one of 1, 2, 3, 4. You entered ", type);
        return false;
    }
    if (validFieldsByType[type].indexOf(field) < 0) {
        //log("You must enter in a valid field to search parking rates by! You entered ", field);
        return false;
    }
    return true;
}

////////////////////////////////////////////////SEARCH FUNCTIONS////////////////////////////////////////////////////////////////


//A function to get user data given an account number. Returns a struct representing
//user data with the specified account number, or null if there is no user in the db
//with the account number
const getUserByAccountNum = (accountNum) => {
    return db.pool.connect().then((client) => {
        const accountQuery = {
            name: "accountToUserData",
            text: 'SELECT * FROM "BreezeParking"."User" WHERE account_num = $1',
            values: [accountNum]
        };
        //client.release();
        return getUserHelper(accountQuery, client);
    }).then((res) => {
        //client.release();
        return Promise.resolve(res);
    })
        .catch((err) => {
            //log("There was an error with pool: ", err);
            //client.release();
            return null;
        })

}

//Function to check if the license plate exists already in the db. Return the account num if exists else -1.
// const getAccountNumFromLP = (lpNum) => {
//     return db.pool.connect().then((client) => {
//         const lpQuery = {
//             name: "findByLP",
//             text: 'SELECT * FROM "BreezeParking"."LicensePlates" WHERE license_num = $1',
//             values: [lpNum]
//         }
//         return client.query(lpQuery).then((res) => {
//             ////log(res.rows[0]);
//             client.release();
//             if (res.rows.length == 1 && res.rows[0].account_num != undefined){
//                 return res.rows[0].account_num;
//             }
//             else if (res.rows.length > 1){
//                 //log("ERROR: This LP appears multiple times in the lp database...");
//                 return res.rows[0].account_num;
//             }
//             else {
//                 return -1;
//             }
//         }).catch((err) => {
//             //log("There was an error when getting user by LP, ", err);
//             return null;
//         })
//     }).catch((err) => {
//         //log("There was an error when getting user by LP, ", err);
//         return null;
//     })
// }

//Function to get a user by email; returns the struct with user info if email found else null.
const getUserByEmail = (email) => {
    return db.pool.connect().then((client) => {
        const emailQuery = {
            name: "EmailQuery",
            text: 'SELECT * FROM "BreezeParking"."User" WHERE email = $1',
            values: [email]
        }
        return client.query(emailQuery).then((res) => {
            client.release();
            if (res.rows.length == 1) {
                return Promise.resolve(res.rows[0]);
            }
            else if (res.rows.length > 1) {
                //log("ERROR: There are multiple users with the same email...")
                return Promise.resolve(res.rows[0]);
            }
            else {
                return Promise.reject(email);
            }
        }).catch((err) => {
            return Promise.reject(email);
        })
    }).catch((err) => {
        return Promise.reject(email);
    })
}

//Function to get a user by phone; returns the struct with user info if phone found else null.
const getUserByPhone = (phone) => {
    return db.pool.connect().then((client) => {
        const phoneQuery = {
            name: "phoneQuery",
            text: 'SELECT * FROM "BreezeParking"."User" WHERE phone_num = $1',
            values: [phone]
        }
        return client.query(phoneQuery).then((res) => {
            client.release();
            if (res.rows.length == 1) {
                return res.rows[0];
            }
            else if (res.rows.length > 1) {
                //log("ERROR: There are multiple users with the same phoneNum...")
                return res.rows[0];
            }
            else {
                return null;
            }
        }).catch((err) => {
            //log("There was an error when getting user by phoneNum, ", err);
            return null;
        })
    }).catch((err) => {
        //log("There was an error when getting user by phoneNum, ", err);
        return null;
    })
}

const deleteUserByField = (field, value, queryName = "deleteUser") => {
    /**
     * Given a field to delete by -> one of phone_num, email, or account_num, this function removes the 
     * user from the User table.
     * Returns 0 on success, 1 on db error, and 2 on invalid param.
     * E.g. deleteUserByField('phone_num', 57689)
     */
    if (['phone_num', 'email', 'account_num'].indexOf(field) < 0) {
        log("You entered an invalid field to delete the user by, please try again.");
        return Promise.reject(2);
    }
    const deleteUserQuery = {
        name: queryName,
        text: 'DELETE FROM "BreezeParking"."User" WHERE ' + field + ' = $1',
        values: [value]
    }
    return db.pool.connect().then((client) => {
        return client.query(deleteUserQuery).then((output) => {
            client.release();
            return output;
        }).catch((err) => {
            log("There was an error on deleteUserQuery, ", err);
            return Promise.reject(1);
        })
    }).then((output) => {
        return 0;
    }).catch((err) => {
        log("There was an error on deleteUserQuery,", err);
        return Promise.reject(1);
    })
}

////////////////////////////////////////////////////////PARKING LOT RATE FUNCTIONS////////////////////////////////////////////////

const updateParkingLotRate = (rate_id, type, params) => {
    /**
     * Given a rate id, and a type of rate ( 1 = weekday, 2 = weekend, 3 = longterm, 4 = special), as well as a struct of params
     * to update, this function updates the entry in the database.
     * 
     * Sample call: const params = {lot_id: 219, mon: true, tues: true, wed: false, thurs: true, fri: true, time_length: 30,
     *  cost: 44, start_time: "06:00:00", end_time: "18:00:00"}
     * updateParkingLotRate(100001, 1, params)
     * Throws Promise.reject(1) upon discovering invalid params, invalid type, or general error.
     */
    for (let key in params) {
        if (!checkParkingRateParams(type, key)) {
            //log("There was an invalid update field entered: ", key, "or an invalid type: ", type);
            //Please see the checkParkingRateParams to view valid fields.
            return Promise.reject(1);
        }
    }
    const tableNames = {
        1: "LotRateWeekday",
        2: "LotRateWeekend",
        3: "LotRateLongterm",
        4: "LotRateSpecial"
    }
    let queryText = 'UPDATE "BreezeParking"."' + tableNames[type] + '" SET';
    for (let key in params) {
        queryText += " ";
        queryText += key;
        queryText += ' = ';
        if (key == 'start_time' || key == 'end_time') {
            queryText += "'";
            queryText += params[key];
            queryText += "'";
        }
        else {
            queryText += params[key];
        }
        queryText += ",";
    }
    queryText = queryText.replace(/(^,)|(,$)/g, "");
    queryText += " WHERE rate_id = " + rate_id;
    const updateRate = {
        name: "updateRate",
        text: queryText
    }
    //log(queryText);

    return db.pool.connect().then((client) => {
        return client.query(updateRate);
    }).then((result) => {
        return 0;
    }).catch((err) => {
        //log("There was an error when updating lot rate ", err);
        return Promise.reject(1);
    });
}

const addParkingRate = (type, params) => {
    /**
     * Type: 1 = weekday, 2 = weekend, 3 = longterm, 4 = special
     * Params: A struct that should contain all the parameters for the specific addition in order. See the tableQueries to see
     * the necessary parameters.
     * Sample call: addParkingRate(1,  { lot_id: 219, mon: true, tues: true, wed: false, thurs: true,
     *  fri: true, time_length: 30, cost: 4, start_time: "06:00:00", end_time: "18:00:00"})
     * -1: General error. -2: Conflict with current rates in db.
     */
    const tableQueries = {
        1: 'INSERT INTO "BreezeParking"."LotRateWeekday"("lot_id", "mon", "tues", "wed", "thurs", "fri", "time_length", "cost", "start_time", "end_time") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ',
        2: 'INSERT INTO "BreezeParking"."LotRateWeekend"("lot_id", "sat", "sun", "time_length", "cost", "start_time", "end_time") VALUES ($1, $2, $3, $4, $5, $6, $7) ',
        3: 'INSERT INTO "BreezeParking"."LotRateLongterm"("lot_id", "day_length", "cost") VALUES ($1, $2, $3) ',
        4: 'INSERT INTO "BreezeParking"."LotRateSpecial"("lot_id", "day", "time_length", "cost", "start_time", "end_time") VALUES ($1, $2, $3, $4, $5, $6) '
    }
    const paramsLists = {
        1: [params.lot_id, params.mon, params.tues, params.wed, params.thurs, params.fri, params.time_length,
        params.cost, params.start_time, params.end_time],
        2: [params.lot_id, params.sat, params.sun, params.time_length, params.cost, params.start_time, params.end_time],
        3: [params.lot_id, params.day_length, params.cost],
        4: [params.lot_id, params.day, params.time_length, params.cost, params.start_time, params.end_time]
    }
    return checkConflictingRates(type, params).then((conflict) => {
        if (conflict) {
            log("There was an error; proposed rate conflicts with what's already in the db");
            return Promise.reject(-2);
        }
        return db.pool.connect();
    }).then((client) => {
        const addQuery = {
            name: "addRate",
            text: tableQueries[type],
            values: paramsLists[type]
        }
        //return 0;
        return client.query(addQuery);
    }).then((result) => {
        //Query completed successfully
        return Promise.resolve(0);
    }).catch((err) => {
        if (err == -2){
            return Promise.reject(-2);
        }
        log("There was an error when adding lot rate, ", err);
        return Promise.reject(-1);
    })
}

const getParkingRatesByField = (type, field, value) => {
    /**
     * Given a type of rate (1 = weekday, 2 = weekend, 3 = longterm, 4 = special), a field to filter by and the value of the 
     * field, this function queries the database and returns the relevant rates.
     * Returns 1 for a general error.
     * Sample call: getParkingRatesByField(2, "time_length", 35); gets all weekend rates that are for 35min durations.
     */
    if (!(checkParkingRateParams(type, field))) {
        //log("Invalid parameters sent to getParkingRatesByField ");
        return Promise.reject(1);
    }

    const tableNames = {
        1: "LotRateWeekday",
        2: "LotRateWeekend",
        3: "LotRateLongterm",
        4: "LotRateSpecial"
    }

    const rateSearchQ = {
        name: "rateSearchQ",
        text: 'SELECT * FROM "BreezeParking"."' + tableNames[type] + '" WHERE ' + field + ' = $1',
        values: [value]
    }
    ////log(rateSearchQ.text);
    return db.pool.connect().then((client) => {
        return client.query(rateSearchQ);
    }).then((results) => {
        return results.rows;
    }).catch((err) => {
        //log("There was an error ", err);
        return Promise.reject(1);
    })
}

/////////////////////////////////////////////////////////////////////logIN/SIGNUP///////////////////////////////////////////////


const addNewUser = (signUpInfo) => {
    /**
     * Expect an object containing user sign up info in this format:
     * 
     * signUpInfo = {
     *     email: "user@gmail.com",            //String
     *     password: "rawUserPasswordInText",  //String
     *     firstName: "userFirstName",         //String
     *     lastName: "userLastName",           //String
     *     phoneNum: 6471234567,               //Integer
     *     accountType: "plm"                  //String
     * }
     * 
     * Return a promise, either of resolve or reject contains an object in this format:
     * 
     * result = {
     *      status: 0,
     *      value: "user@gmail.com"
     * }
     * 
     * status meaning:
     * resolve
     * 0-Sign up successful, result.value is user email
     * 
     * reject
     * 1-Sign up failed with error, result.value is error description
     * 2-Email is already registered, result.value is user email
     * 3-Phone Number is already registered, result.value is user phone number
     */
    return new Promise((resolve, reject) => {
        db.pool.connect().then(client => {
            const checkQuery = {
                name: 'checkDuplicate',
                text: 'SELECT email, phone_num FROM "BreezeParking"."User" WHERE email = $1 OR phone_num = $2',
                values: [signUpInfo.email, signUpInfo.phoneNum]
            }

            client.query(checkQuery).then(res => {
                if (res.rows.filter(entry => entry.email == signUpInfo.email).length > 0) {
                    respondWith(client, 2, "Email is already registered", reject)
                } else if (res.rows.filter(entry => entry.phone_num == signUpInfo.phoneNum).length > 0) {
                    respondWith(client, 3, "Phone Number is already registered", reject)
                } else {
                    const newUserQuery = {
                        name: 'saveNewUser',
                        text: 'INSERT INTO "BreezeParking"."User" ("first_name", "last_name", "phone_num", "email", "type") VALUES ($1, $2, $3, $4, $5) RETURNING account_num',
                        values: [signUpInfo.firstName, signUpInfo.lastName, signUpInfo.phoneNum, signUpInfo.email, signUpInfo.accountType],
                        rowMode: 'array'
                    }

                    client.query(newUserQuery).then(res => {
                        if (res.rows[0].length != 1) {
                            respondWith(client, 1, "Error in generating account number in database.", reject)
                        } else {
                            bcrypt.hash(signUpInfo.password, 10, (err, hash) => {
                                if (err) {
                                    respondWith(client, 1, err, reject)
                                } else {
                                    const newPasswordQuery = {
                                        name: 'savePassword',
                                        text: 'INSERT INTO "BreezeParking"."Password"("account_num", "password") VALUES ($1, $2)',
                                        values: [res.rows[0][0], hash]
                                    }

                                    let acctNum = res.rows[0][0]

                                    client.query(newPasswordQuery).then(res => {
                                        respondWith(client, 0, { email: signUpInfo.email, accountNum: acctNum }, resolve)
                                    }).catch(error => {
                                        respondWith(client, 1, error, reject)
                                    })
                                }
                            })
                        }
                    }).catch(error => {
                        respondWith(client, 1, error, reject)
                    })
                }
            }).catch(error => {
                respondWith(client, 1, error, reject)
            })
        }).catch(error => {
            respondWith(client, 1, error, reject)
        })
    })
}

const loginUser = (email, password) => {
    /**
     * Expect both email and password as Strings
     * 
     * Return a promise, either of resolve or reject contains an object in this format:
     * 
     * result = {
     *      status: 0,
     *      value: "user@gmail.com"
     * }
     * 
     * status meaning:
     * resolve
     * 0-//login successful, result.value is user email, account number and account type: {email: "user@gmail.com", accountNum: 1000000, accountType: "plm"}
     * 
     * reject
     * 1-//login Failed with error, result.value is error description
     * 2-Email not registered, result.value is user email
     * 3-Account not active, result.value is user email
     * 4-Incorrect password, result.value is user email
     */
    return new Promise((resolve, reject) => {
        db.pool.connect().then(client => {
            const userQuery = {
                name: 'retrieveUser',
                text: 'SELECT * FROM "BreezeParking"."User" WHERE email = $1',
                values: [email]
            }

            client.query(userQuery).then(res => {
                if (res.rows.length > 0) {
                    if (!res.rows[0].active) {
                        respondWith(client, 3, email, reject)
                    } else {
                        const passwordQuery = {
                            name: 'retrievePassword',
                            text: 'SELECT * FROM "BreezeParking"."Password" WHERE account_num = $1',
                            values: [Number(res.rows[0].account_num)]
                        }

                        const accountNum = Number(res.rows[0].account_num)
                        const accountType = res.rows[0].type
                        client.query(passwordQuery).then(res => {
                            if (res.rows.length > 0) {
                                bcrypt.compare(password, res.rows[0].password, (err, res) => {
                                    if (err) {
                                        respondWith(client, 1, err, reject)
                                        return
                                    }
                                    if (res) {
                                        respondWith(client, 0, { email: email, accountNum: accountNum, accountType: accountType }, resolve)
                                    } else {
                                        respondWith(client, 4, email, reject)
                                    }
                                })
                            } else {
                                respondWith(client, 1, "Couldn't find the password in the database", reject)
                            }
                        }).catch(error => {
                            respondWith(client, 1, error, reject)
                        })
                    }
                } else {
                    respondWith(client, 2, email, reject)
                }
            }).catch(error => {
                respondWith(client, 1, error, reject)
            })
        }).catch(error => {
            respondWith(client, 1, error, reject)
        })
    })
}

const updateUserByField = (field, value, updateStruct, queryName = "updateUser") => {
    /**
     * Given a field in ['account_num', 'phone_num', 'email'] and value for thsi field, as well as a struct such as 
     * {first_name: string, last_name: string, phone_num: int, email: string}, this function updates the user props.
     * Returns output on success, 1 on db error, and 2 on invalid params.
     */
    if (['account_num', 'phone_num', 'email'].indexOf(field) < 0) {
        log("Error, an invalid field was entered!");
        return Promise.reject(2);
    }
    propertiesList = [];
    valuesList = [];
    for (let key in updateStruct) {
        if (updateStruct.hasOwnProperty(key) && ['phone_num', 'email', 'first_name', "last_name"].indexOf(key) >= 0) {
            propertiesList.push(key);
            valuesList.push(updateStruct[key]);
        }
    }
    let queryText = 'UPDATE "BreezeParking"."User" SET ';
    for (let i = 0; i < propertiesList.length - 1; i++) {

        queryText += propertiesList[i];
        queryText += " = \'";
        queryText += valuesList[i];
        queryText += "\'";
        queryText += ", ";
    }
    queryText += propertiesList[propertiesList.length - 1];
    queryText += " = \'";
    queryText += valuesList[propertiesList.length - 1];
    queryText += "\'";
    queryText += ' WHERE ' + field + ' = $1';
    log("The queryText is: ", queryText);
    const updateUserQuery = {
        name: queryName,
        text: queryText,
        values: [value]
    }
    return db.pool.connect().then((client) => {
        return client.query(updateUserQuery).then((output) => {
            client.release();
            return Promise.resolve(output);
        }).catch((err) => {
            return Promise.reject(err);
        })
    }).then((output) => {
        return Promise.resolve(output);
    }).catch((err) => {
        log("There was an error when updating user props ", err);
        return Promise.reject(1);
    })
}

const updatePW = (userID, newPassword, queryName = "updatePWQuery") => {
    /**
     * Given a user account number and the value of the new password in clear text, this function updates the user's password in
     * the password table of the db.
     * E.g. updatePW(100110, 'password123');
     */

    return hashPassword(newPassword).then((hashedPassword) => {
        const queryText = `UPDATE "BreezeParking"."Password" SET password = $1 WHERE account_num = ${userID}`;
        const updatePWQuery = {
        name: queryName,
        text: queryText,
        values: [hashedPassword]
    }
        return Promise.all([db.pool.connect(), updatePWQuery]);
    })
    .then(items => {
        const pswdQuery = items[1];
        const client = items[0];
        return client.query(pswdQuery).then((output) => {
            client.release();
            return output;
        }).catch((err) => {
            return Promise.reject(err);
        })
    })
    .then(output => {
        return Promise.resolve(output);
    })
    .catch((err) => {
        log("There was an error when updating password ", err);
        return Promise.reject(err);
    })
}

////////////////////////////////////////////////LICENSE PLATE NUMBERS///////////////////////////////////////////////////////////


const formatLPNum = (lpNum) => {
    /**
     * Given a license plate number, this function removes all the whitespace, and turns all lowercase letters to uppercase.
     */
    lpNum = lpNum.replace(/\s/g, ''); //Removes whitespace from LPNUM
    lpNum = Array.from(lpNum).map((c) => {
        if (!isLetter(c)) {
            return c;
        }
        if (isLowerCase(c)) {
            return c.toUpperCase();
        }
        return c;
    }).join('');
    return lpNum;
}

const addLicensePlateNum = (accountNum, lpNum) => {
    /**
     * accountNum: int, lpNum: str
     * 
     * Function to add a license plate number to the table. Checks if lpNum already exists, and if current user has two license
     * numbers already. Returns a struct in the format {status: <INT>, msg: <str>}. See code for status codes; See msg field 
     * in struct for more details.
     */
    lpNum = formatLPNum(lpNum);
    //log("The license number is now: ", lpNum);
    return getUserByAccountNum(accountNum).then((result) => {
        if (result == null) {
            ////log("ERROR: No user with this account number was found ", accountNum);
            return Promise.reject({ status: -4, msg: "ERROR: No user with this account number was found " + accountNum });
        }
        return getPlatesByField('account_num', accountNum, "getPlatesByAccountNum"); //TODO: Fix this

    }).then((associatedPlates) => {
        if (associatedPlates.length >= 2) {
            return Promise.reject({ status: -5, msg: "ERROR: you already have two plates registered!" });
        }
        log("The LP num is", lpNum);
        return getPlatesByField('license_num', lpNum, "getPlatesByLpNum");
    }).then((rowsWithLpNum) => {
        if (rowsWithLpNum.length == 1) {
            return Promise.resolve(rowsWithLpNum[0].account_num);
        }
        else if (rowsWithLpNum.length > 1) {
            log("There was an error, this lp number appears multiple times in the db");
            return Promise.resolve(rowsWithLpNum[0].account_num);
        }
        return -1;
    })
        .then((curAssociatedAcc) => {
            if (curAssociatedAcc != -1 && curAssociatedAcc != accountNum) {
                //log(curAssociatedAcc);
                ////log("ERROR: Someone else has already registered this plate number to their account, ", lpNum);
                return Promise.reject({ status: -2, msg: "ERROR: Someone else has already registered this plate number to their account, " + lpNum });
            }
            else if (curAssociatedAcc == accountNum) {
                ////log("You have already registered this license plate to your account, ", lpNum);
                return Promise.reject({ status: -3, msg: "ERROR: You have already registered this license plate to your account, " + lpNum });
            }
            const lpQuery = {
                name: "addlp",
                text: 'INSERT INTO "BreezeParking"."LicensePlates"("account_num", "license_num") VALUES ($1, $2)',
                values: [Number(accountNum), lpNum]
                //text: `INSERT INTO "BreezeParking"."LicensePlates"("account_number", "license_number") 
                //VALUES (4567, 'BCYZ124')`
            }
            return lpQuery;
        })
        .then((query) => {
            return db.pool.connect().then((client) => {
                return client.query(query);

            }).then((res) => {
                //client.release();
                return Promise.resolve({ status: 0, msg: "Success" });
            }).catch((err) => {
                ////log("Error with LP query ", err);
                return Promise.reject({ status: -1, msg: err });
            })
        }).catch((error) => {
            ////log("There was an error when inserting into LicensePlates table ", error);
            return Promise.reject(error);
        })
}

const deleteLPNumByField = (field, value, queryName = "deleteLp") => {
    /**
     * A function to remove a license plate number from the db based on either account_num or license_num. 
     * Returns 0 on success, or 1 on db failure, or 2 on invalid field param. 
     * E.g. deleteLPNumByField( 'license_num', 'chet 345');
     */
    if (field != 'account_num' && field != 'license_num') {
        log("There was an error in the field you specified.");
        return Promise.reject(2);
    }

    if (field == 'license_num') {
        value = formatLPNum(value);
    }

    const deleteLpQuery = {
        name: queryName,
        text: 'DELETE FROM "BreezeParking"."LicensePlates" WHERE ' + field + ' = $1',
        values: [value]
    }

    return db.pool.connect().then((client) => {
        return client.query(deleteLpQuery);
    }).then((result) => {
        return Promise.resolve(0);
    }).catch((err) => {
        log("There was an error when deleting a license plate ", err);
        return Promise.reject(2);
    })
}


const getPlatesByField = (field, value, queryName = "platesByFieldQuery") => {
    /**
     * field: str, one of account_num or license_num
     * value: either str or int, depending on if we are searching by account_num or license_num
     * queryName: Only required to be used if you are calling this getPlatesByField multiple times in the same function. If so,
     * each time you call this function, you must specify a different queryName to avoid same name errors.
     * 
     * Returns matching rows with this account in a list format, i.e.[ { account_num: 100013, license_num: '260WCS' } ]
     * else NULL if there was an error.
     */
    if (field != 'account_num' && field != 'license_num') {
        log("There was an error in the field you specified.");
        return null;
    }

    return db.pool.connect().then((client) => {
        const platesByFieldQuery = {
            name: queryName,
            text: 'SELECT * FROM "BreezeParking"."LicensePlates" WHERE ' + field + ' = $1',
            values: [value]
        }
        return client.query(platesByFieldQuery).then((res) => {
            client.release();
            return res.rows;
        })
    }).catch((err) => {
        log("There was an error: ", err);
        return null;
    });
}

const updateLPByAccountNum = (accountNum, plates) => {
    /**
     * This should take accountNum and a struct of the form
     * {
     *  plateOne: string, plateTwo: string
     * }
     * and update the user's plates info in the database, by deleting the old plates and replacing them with these two.
     * Returns output on success or 1 on db error.
     */
    const platesToAdd = [];
    if (plates["plateOne"] != "" && plates["plateOne"] != undefined && plates["plateOne"] != null) {
        platesToAdd.push(formatLPNum(plates["plateOne"]));
    }
    if (plates["plateTwo"] != "" && plates["plateTwo"] != undefined && plates["plateTwo"] != null) {
        platesToAdd.push(formatLPNum(plates["plateTwo"]));
    }
    return deleteLPNumByField('account_num', accountNum).then((output) => {
        const promiseList = [];
        for (let i = 0; i < platesToAdd.length; i++) {
            promiseList.push(new Promise(function (resolve, reject) {
                resolve(addLicensePlateNum(accountNum, platesToAdd[i]));
            }))
        }
        return Promise.all(promiseList);
    }).then((output) => {
        return Promise.resolve(output);
    }).catch((err) => {
        log("There was an error while updating license plate numbers ", err);
        return Promise.reject(1);
    });
};

///////////////////////////////////////////////TRANSACTION FUNCTIONS//////////////////////////////////////////////////////////////
const addTransaction = (account_num, lot_id, time_entered, time_exited = null, cost = null) => {
    /**
     * Adds a new transaction to the database. If time_exited and cost are null, assume that the transaction is not yet
     * completed and the user is still in the parking lot. Returns 0 on success and -1 on failure
     */
    //time_entered = new Date();
    log("The time entered is: ", time_entered);
    
    log(typeof(time_entered));
    return db.pool.connect().then((client) => {
        const addTransaction = {
            name: "addTransaction",
            text: 'INSERT INTO "BreezeParking"."Transactions"("account_num", "lot_id", "time_entered", "time_exited", "cost") VALUES($1, $2, $3, $4, $5)',
            values: [account_num, lot_id, time_entered, time_exited, cost]
        }
        return client.query(addTransaction);
    }).then((result) => {
        return 0;
    }).catch((err) => {
        log("There was an error when adding the transaction, ", err);
        return -1;
    })
}


const getTransactionsByField = (field, value, incompleteOnly = false) => {
    /**
     * Given a field as one of 'account_num', 'lot_id', 'trans_id' or 'cost', this function searches the database for the 
     * item(s) that have the value of the specified field. 
     * Incomplete only means that this fn will return those transactions that are not yet completed i.e. user did not exit yet.
     * E.g. getTransactionsByField('account_num', 2345678) gets all transactions for that particular account
     */
    if (['account_num', 'lot_id', 'trans_id', 'cost'].indexOf(field) < 0) {
        //log("Invalid value specified for field; you specified ", field);
        return Promise.reject();
    }
    let queryText = 'SELECT * FROM  "BreezeParking"."Transactions" WHERE ' + field + ' = $1';
    if (incompleteOnly) {
        queryText = 'SELECT * FROM  "BreezeParking"."Transactions" WHERE ' + field + ' = $1 AND time_exited IS NULL'
    }
    //log("the query text is: ", queryText);

    return db.pool.connect().then((client) => {
        const getTransactions = {
            name: "getTransactions",
            text: queryText,
            values: [value]
        }
        return client.query(getTransactions);
    }).then((result) => {
        //log("The result is: ", result);
        return Promise.resolve(result.rows);
    }).catch((err) => {
        //log("There was an error when getting transactions by field, ", err);
        return Promise.reject();
    })
}

// getTransactionsByField('account_num', 100013, true).then((result) => {
//     log("The result is: ", result);
// }).catch((err) => {
//     log("The erroris: ", err);
// })

const getAllTransactionsForPLM = (accountNum) => {
    /**
     * Given an account number of a parking lot manager, this function returns a list of all transactions which occurred
     * for the parking lots of the parking lot manager, in list format. This function is useful for generating 
     * aggregate stats for the parking lot managers.
     * E.g. getAllTransactionsForPLM(100317) returns a lst with structs of the following form: {trans_id: 100006,
     *  account_num: 100063, lot_id: 253, time_entered: 2004-10-19T14:23:54.000Z, time_exited: null, cost: null}
     * //account num for test is 100317, lot #s which 100317 owns which have transactions is 252,253
     */


    return getParkingLotByField('account_num', accountNum).then((rows) => {
        lot_ids = []
        for (let i = 0; i < rows.length; i++) {
            lot_ids.push(rows[i].lot_id)
        }
        return lot_ids;
    }).then((lot_ids) => {
        //Make string builder which appends OR + lot num for each lot num, e.g. WHERE lot_id = 252 OR lot_id = 253
        let queryStr = 'SELECT * FROM "BreezeParking"."Transactions" WHERE ';
        for (let i = 0; i < lot_ids.length - 1; i++) {
            queryStr += ' lot_id = ';
            queryStr += lot_ids[i];
            queryStr += ' OR ';
        }
        queryStr += ' lot_id = ';
        queryStr += lot_ids[lot_ids.length - 1];

        const plmTransactionsQuery = {
            name: 'plmTransactionsQuery',
            text: queryStr,
            values: []
        }
        return db.pool.connect().then((client) => {
            return { dbclient: client, query: plmTransactionsQuery }
        }).catch((err) => {
            log("Error in connecting to db ", err);
            return Promise.reject(1);
        });
    }).then((struct) => {
        const client = struct.dbclient;
        const query = struct.query;
        log("Reached here");
        //log("client is: ", client)
        return client.query(query).then((result) => {
            client.release();
            return result;
        }).catch((err) => {
            log("Error in executing query ", err);
            return Promise.reject(1);
        });
    }).then((result) => {
        return result.rows;
    })

        .catch((err) => {
            log("Reached ERROR ", err);
            return []
        })

}

const updateTransactionsByField = (field, value, updateStruct, queryName = "updateTransactionByField") => {
    /**
     * WARNING THIS FN HAS REDUCED FLEXIBILITY, PLEASE NOTIFY SL TO FIX IT UP IF U ARE DEFINING A NEW FN THAT USES
     * THIS FN **************************************
     * Given a field such as 'trans_id', a value for the field to take, and a struct containing params to update, this
     * function updates the associated row(s) on the database.
     * Returns 0 on success, 1 on db error, and 2 on invalid param(s)
     * E.g. updateTransactionsByField('trans_id', 100007, {time_exited: "2004-10-20 10:23:54", cost: 5}) updates the transaction
     * with id 100007, making the timeExited be "2004-10-20 10:23:54" and the cost be $5.
     */
    //value = 100028;
    log("The value is: ", value);
    if (['trans_id'].indexOf(field) < 0) { //For now just search by trans_id to avoid accidentally screwing up the db.
        log("You entered an invalid column to search by");
        return Promise.reject(2);
    }
    const propertiesList = [];
    const valuesList = [];
    updateStruct["time_exited"] = new Date();
    log("The updatStruct time exited is ", updateStruct["time_exited"]);
    if (updateStruct["time_exited"] == undefined || updateStruct["time_exited"] == null){
        updateStruct["time_exited"] = new Date();
        log("The updatStruct time exited is ", updateStruct["time_exited"]);
    }
    for (let key in updateStruct) {//Check the keys to make sure that they are proper.
        if (updateStruct.hasOwnProperty(key)) {
            if (['time_entered', 'time_exited', 'cost'].indexOf(key) < 0) {
                log("There was an invalid property in the updateStruct!");
                return Promise.reject(2);
            }
            else{
                propertiesList.push(key);
                valuesList.push(updateStruct[key]);
            }
        }
    }
    let queryText = 'UPDATE "BreezeParking"."Transactions" ';
    queryText += ' SET ';
    for (let i = 0; i < propertiesList.length - 1; i++) {

        queryText += propertiesList[i];
        queryText += ' = \'';
        queryText += valuesList[i];
        queryText += '\', ';
    }
    queryText += propertiesList[propertiesList.length - 1];
    queryText += ' = \'';
    queryText += valuesList[propertiesList.length - 1];
    queryText += '\'';
    queryText += ' WHERE ' + field + " = $1";
    //log(queryText);
    const queryText2 = 'UPDATE "BreezeParking"."Transactions" SET time_exited = $1, cost = $2 WHERE trans_id = $3';
    const updateTransQuery2 = {
        name: queryName + "as",
        text: queryText2,
        values: [new Date(), updateStruct["cost"], value]
    }
    log(queryText2);
    const updateTransQuery = {
        name: queryName,
        text: queryText,
        values: [value]
    }
    return db.pool.connect().then((client) => {
        return client.query(updateTransQuery2).then((output) => {
            client.release();
            return output;
        }).catch((err) => {
            return Promise.reject(err);
        })
    }).then((output) => {
        return 0;
    }).catch((err) => {
        log("There was an error when updating transaction ", err);
        return Promise.reject(1);
    })
    // for (let i = 100012; i < 100019; i++ ){
    //     const qName = "batchUpdate" + i;
    //     updateTransactionsByField('trans_id', i, {time_exited: "2004-10-29 11:23:54", cost: 2.5}, qName);
    // }
}



//     log("The field is ", field);
//     log("The value is ", value);
//     log("The updateStruct is: ", updateStruct);
//     if (['trans_id'].indexOf(field) < 0) { //For now just search by trans_id to avoid accidentally screwing up the db.
//         log("You entered an invalid column to search by");
//         return Promise.reject(2);
//     }
//     const propertiesList = [];
//     const valuesList = [];
//     if (updateStruct["time_exited"] == undefined || updateStruct["time_exited"] == null){
//         updateStruct["time_exited"] = new Date();
//         log("The updatStruct time exited is ", updateStruct["time_exited"]);
//     }
//     for (let key in updateStruct) {//Check the keys to make sure that they are proper.
//         if (updateStruct.hasOwnProperty(key)) {
//             if (/*['time_entered', 'time_exited', 'cost']*/['time_exited'].indexOf(key) < 0) {
//                 log("There was an invalid property in the updateStruct!");
//                 //return Promise.reject(2);
//             }
//             else{
//                 propertiesList.push(key);
//                 valuesList.push(updateStruct[key]);
//             }
//         }
//     }
//     let queryText = 'UPDATE "BreezeParking"."Transactions" ';
//     queryText += ' SET ';
//     for (let i = 0; i < propertiesList.length - 1; i++) {

//         queryText += propertiesList[i];
//         queryText += ' = \'';
//         queryText += valuesList[i];
//         queryText += '\', ';
//     }
//     queryText += propertiesList[propertiesList.length - 1];
//     queryText += ' = ';
//     queryText += '$1';//valuesList[propertiesList.length - 1];
//     queryText += ' ';
//     queryText += ' WHERE ' + field + " = $2";
//     log(queryText);
//     const updateTransQuery = {
//         name: queryName,
//         text: queryText,
//         values: [valuesList[0], value]
//     }
//     return db.pool.connect().then((client) => {
//         return client.query(updateTransQuery).then((output) => {
//             client.release();
//             return output;
//         }).catch((err) => {
//             return Promise.reject(err);
//         })
//     }).then((output) => {
//         log("Returning...", output);
//         return Promise.resolve(0);
//     }).catch((err) => {
//         log("There was an error when updating transaction ", err);
//         return Promise.reject(1);
//     })
//     // for (let i = 100012; i < 100019; i++ ){
//     //     const qName = "batchUpdate" + i;
//     //     updateTransactionsByField('trans_id', i, {time_exited: "2004-10-29 11:23:54", cost: 2.5}, qName);
//     // }
// }

/////////////////////////////////////////////////PARKING PASSES FUNCTIONS/////////////////////////////////////////////////////////
const checkConflictingPass = (accountNum, lotId, startDate, endDate) => {
    /**
     * Given an accountNum, a lotId, and start/end date, this function checks for conflicts i.e. if the user already
     * has a parking pass for this time period for this lot.
     * Returns true if there is a conflict, else false.
     * Sample call: checkConflictingPass(100045, 219, "2020-04-01", "2020-04-30")
     */
    const conflictingPassQuery = {
        name: "conflictingPassQuery",
        text: 'SELECT * FROM "BreezeParking"."ParkingPasses" WHERE account_num = $1 AND lot_id = $2',
        values: [accountNum, lotId]
    }
    return db.pool.connect().then((client) => {
        return client.query(conflictingPassQuery).then((output) => {
            client.release();
            return output.rows;
        }).catch((err) => {
            log("There was an error when releasing client from checkConflictingPass ", err);
            return [];
        })
    }).then((rows) => {
        const conflicts = rows.filter((entry) => {
            return new Date(entry.start_date) <= new Date(endDate) && new Date(startDate) <= new Date(entry.end_date);
        })
        return conflicts.length > 0;
    }).catch((err) => {
        log("There was an error when checking pass conflicts: ", err);
        return false;
    })
}

const addParkingPass = (account_num, lot_id, start_date, end_date, cost) => {
    /**
     * Adds a new parking pass to the database given the correct parameters. Note that start and end dates are only dates; we
     * don't store times in this table as it is unnecessary.
     * Sample call: addParkingPass(100045, 219, "2020-04-01", "2020-04-30", 135)
     */
    return db.pool.connect().then((client) => {
        const addPass = {
            name: "addPass",
            text: 'INSERT INTO "BreezeParking"."ParkingPasses"("account_num", "lot_id", "start_date", "end_date", "cost") VALUES($1, $2, $3, $4, $5) ',
            values: [account_num, lot_id, start_date, end_date, cost]
        }
        return client.query(addPass);
    }).then((result) => {
        return 0;
    }).catch((err) => {
        //log("There was an error, ", err);
        return Promise.reject(err);
    })
}

const getPassesByField = (field, value) => {
    /**
     * Given a desired field as the name of a column in a string, as well as the desired value for such a field, this function 
     * returns the item(s) that satisfy this field. 
     * NOTE: field is one of: ["pass_id", "account_num", "lot_id", "start_date", "end_date", "cost"]. Any other values will 
     * throw an error!
     */
    if (["pass_id", "account_num", "lot_id", "start_date", "end_date", "cost"].indexOf(field) < 0) {
        //log("Invalid field val; you entered in ", field);
        return Promise.reject(1);
    }
    return db.pool.connect().then((client) => {
        const getPasses = {
            name: "getPasses",
            text: 'SELECT * FROM "BreezeParking"."ParkingPasses" WHERE ' + field + ' = $1',
            values: [value]
        }
        return client.query(getPasses);
    }).then((result) => {
        return result.rows;
    }).catch((err) => {
        //log("There was an error, ", err);
        return Promise.reject(1);
    })
}

//////////////////////////////////////////////////PARKING LOT DATA FUNCTIONS/////////////////////////////////////////////////////

const addParkingLot = (accountNum, parkingLotInfo) => {
    /**
     * Expect an object containing parking lot info in this format:
     * 
     * parkingLotInfo = {
     *     lotName: "parkingLotName",           //String
     *     address: "parkingLotAddress",        //String
     *     capacity: 3120,                      //Integer
     *     type: "streetParking",               //String
     *     restriction: "Height < 5m"           //String
     *     description: "Located near blah",    //String
     * }
     * 
     * Return a promise, either of resolve or reject contains an object in this format:
     * 
     * result = {
     *      status: 0,
     *      value: lotid
     * }
     * 
     * status meaning:
     * resolve
     * 0-Parking lot addition successful, result.value is lot id
     * 
     * reject
     * 1-Parking lot addition failed with error, result.value is error description
     */
    return new Promise((resolve, reject) => {
        db.pool.connect().then(client => {
            const newParkingLotQuery = {
                name: 'saveNewParkingLot',
                text: 'INSERT INTO "BreezeParking"."ParkingLot" ("account_num", "lot_name", "address", "capacity", "type", "restriction", "description") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING lot_id',
                values: [accountNum, parkingLotInfo.lotName, parkingLotInfo.address, parkingLotInfo.capacity, parkingLotInfo.type, parkingLotInfo.restriction, parkingLotInfo.description],
                rowMode: 'array'
            }

            client.query(newParkingLotQuery).then(res => {
                if (res.rows[0].length != 1) {
                    respondWith(client, 1, "Error in generating parking lot id in database.", reject)
                } else {
                    respondWith(client, 0, res.rows[0][0], resolve)
                }
            }).catch(error => {
                respondWith(client, 1, error, reject)
            })
        }).catch(error => {
            respondWith(client, 1, error, reject)
        })
    })

}

function getParkingLotByField(field, value) {
    /**
     * Given a field in the parking lot table and the value of such a field, this function returns the parking lot data rows
     * which satisfy such a field. The possible values of the field are: ['lot_id', 'account_num', 'lot_name', 'address', 
     * 'capacity', 'type', 'restriction', 'description', 'num_occupants', 'active']. Note: We probably should not be searching
     * by restrictions or description since those are strings.
     * Returns 2 if invalid params are entered, or 1 for general error
     * Sample: getParkingLotByField('capacity', 123) returns the data for all lots with a capacity of 123
     */
    if (['lot_id', 'account_num', 'lot_name', 'address', 'capacity', 'type', 'restriction', 'description',
        'num_occupants', 'active'].indexOf(field) < 0) {
        log("You entered an invalid field to search by: ", field);
        return Promise.reject(2);
    }
    let queryText = 'SELECT * FROM "BreezeParking"."ParkingLot" WHERE ' + field + ' = $1';
    const searchQuery = {
        name: "searchParkingLots",
        text: queryText,
        values: [value]
    }
    return db.pool.connect().then((client) => {
        return client.query(searchQuery);
    }).then((result) => {
        return result.rows;
    }).catch((err) => {
        log("There was an error ", err);
        return Promise.reject(1);
    })
}

const updateParkingLotByID = (lotID, lotInfo, queryName = "updateParkingLot") => {
    /**
     * A function that would update the information of the lotID.
     * lotInfo is of the format
     * {
     *  capacity: int, 
     *  restriction: string,
     *  description: string,
     *  lot_name: string,
     *  num_occupant: int
     * }
     * returns a promise
     * When some part of the information is unchanged, it is re-entered by the frontend as the same as it was before.
     * Managed by the frontend.
     */
    const propertiesList = [];
    const valuesList = [];
    for (let key in lotInfo) {
        if (lotInfo.hasOwnProperty(key) && ['capacity', 'restriction', 'description', "lot_name", 'num_occupant',
            'active'].indexOf(key) >= 0) {
            propertiesList.push(key);
            valuesList.push(lotInfo[key]);
        }
    }
    let queryText = 'UPDATE "BreezeParking"."ParkingLot" SET ';
    for (let i = 0; i < propertiesList.length - 1; i++) {
        queryText += propertiesList[i];
        queryText += " = \'";
        queryText += valuesList[i];
        queryText += "\'";
        queryText += ", ";
    }
    queryText += propertiesList[propertiesList.length - 1];
    queryText += " = \'";
    queryText += valuesList[propertiesList.length - 1];
    queryText += "\'";
    queryText += ' WHERE lot_id = $1';
    log("The queryText is: ", queryText);
    const updateParkingLotQuery = {
        name: queryName,
        text: queryText,
        values: [lotID]
    }
    return db.pool.connect().then((client) => {
        return client.query(updateParkingLotQuery).then((output) => {
            client.release();
            return Promise.resolve(output)
            //return output;
        }).catch((err) => {
            return Promise.reject(err);
        })
    }).then((output) => {
        return Promise.resolve(output)
        //return 0;
    }).catch(error => {
        log("There was an error when updating user props ", err);
        return Promise.reject(1);
    })
}

const deleteParkingLotById = (lotID, queryName = "deleteParkingLot") => {
    /**
     * A function that would delete the parking lot given the lot id. Returns 0 on success, or 1 on db error.
     */
    const deleteLotQuery = {
        name: queryName,
        text: 'DELETE FROM "BreezeParking"."ParkingLot" WHERE lot_id  =  $1',
        values: [lotID]
    }
    return db.pool.connect().then((client) => {
        return client.query(deleteLotQuery).then((output) => {
            client.release();
            return output;
        }).catch((err) => {
            return Promise.reject(err);
        })
    }).then((output) => {
        return 0;
    }).catch((err) => {
        log("There was an error when deleting parking lot, ", err);
        return 1;
    })
}
/////////////////////////////////////////////COUNTER FUNCTIONS///////////////////////////////////////////////////////////////////

const retrieveAndIncrementCounter = (counterName, queryName = "counterQuery") => {
    /**
     * Given a name of a counter, this function gets the current value of the counter, increments the counter on the db,
     * and returns the current value of the specified counter to the user.
     * e.g. retrieveAndIncrementCounter("temp_email_counter") returns the current value of temp_email_counter and increments it
     * in the db.
     * Returns error string on error, else the value of the counter before it was incremented.
     *  e.g. retrieveAndIncrementCounter("temp_phone_counter")
     */
    const counterDirectory = {
        "temp_email_counter": 100,
        "temp_phone_counter": 101
    }
    const countersToDecrement = [101]
    if (!counterDirectory.hasOwnProperty(counterName)) {
        return Promise.reject("ERROR INVALID COUNTER SPECIFIED");
    }
    const counterId = counterDirectory[counterName];
    let retrieveQueryText = 'SELECT counter_val FROM "BreezeParking"."Counter" WHERE counter_id = $1';
    const retrieveQuery = {
        name: "retrieveQuery",
        text: retrieveQueryText,
        values: [counterId]
    }
    return db.pool.connect().then((client) => {
        return client.query(retrieveQuery).then((output) => {
            client.release();
            return output.rows[0];
        }).catch((err) => {
            return Promise.reject(err);
        })
    }).then((counterVal) => {
        let queryText = 'UPDATE "BreezeParking"."Counter" SET counter_val = counter_val + 1 WHERE counter_id = $1\
        RETURNING counter_val'
        if (countersToDecrement.indexOf(counterId) >= 0) {
            queryText = 'UPDATE "BreezeParking"."Counter" SET counter_val = counter_val - 1 WHERE counter_id = $1\
            RETURNING counter_val'
        }
        const counterQuery = {
            name: queryName,
            text: queryText,
            values: [counterId]
        }
        return db.pool.connect().then((client) => {
            return client.query(counterQuery).then((output) => {
                client.release();
                return counterVal;
            }).catch((err) => {
                return Promise.reject(err);
            })
        })
    }).then((output) => {
        return output["counter_val"];
    }).catch((err) => {
        log("There was an error when getting and incrementing counter: ", err);
        return Promise.reject(err);
    })
}

/////////////////////////////////////////////////TESTING AREA////////////////////////////////////////////////////////////////////
// const newParkingLot = {
//     lotName: "Drive Drive!",
//     address: "3827 Random Street",
//     capacity: 150,
//     type: "underground",
//     restriction: "No big trucks",
//     description: "Right next to the Ferry rides in Toronto Island"
// }
// addParkingLot(100062, newParkingLot).then((result) => {
//     //log(result)
// }).catch((error) => {
//     //log(error)
// })

//GEt parking lot by field test
// getParkingLotByField('account_num', 100062).then((output) => {
//     log("The output is ", output);
// }).catch((err) => {
//     log("There was an error: ", err);
// })
//Check conflicting rates test:
// log(conflictingRatesWeekday({ lot_id: 219, mon: true, tues: true, wed: false, thurs: false,
//     fri: false, time_length: 30, cost: 4, start_time: "06:00:00", end_time: "18:00:00"}, [

//     { lot_id: 219, mon: false, tues: false, wed: false, thurs: true,
//     fri: true, time_length: 30, cost: 4, start_time: "06:00:00", end_time: "18:00:00"}, //diff days same rate

//     { lot_id: 219, mon: true, tues: true, wed: false, thurs: false,
//     fri: false, time_length: 60, cost: 7, start_time: "06:00:00", end_time: "18:00:00"}, //same days diff rate

//     { lot_id: 219, mon: true, tues: true, wed: false, thurs: false,
//     fri: false, time_length: 30, cost: 4, start_time: "18:00:00", end_time: "06:00:00"} //same day same rate

//     ]));

//log(conflictingRatesWeekend({ lot_id: 219, sat: true, sun: false,
//      time_length: 30, cost: 4, start_time: "06:00:00", end_time: "18:00:00"}, [

//     { lot_id: 219, sat: false, sun: true, time_length: 30, cost: 4, 
//         start_time: "06:00:00", end_time: "18:00:00"}, //diff days same rate

//     { lot_id: 219, sat: true, sun: false, time_length: 60, cost: 7, 
//         start_time: "06:00:00", end_time: "18:00:00"}, //same days diff rate

//     { lot_id: 219, sat: true, sun: true, time_length: 30, cost: 4, 
//         start_time: "19:00:00", end_time: "05:00:00"} //same day same rate

//     ]));


//Search for parking lot rate test
// getParkingRatesByField(2, "time_length", 35).then((output) => {
//     //log("The output is ", output);
// }).catch((err) => {
//     //log("There was an error by getting parking rates by field ", err);
// });

//Update parking lot rate test:
// const params = {
//         lot_id: 219, mon: true, tues: true, wed: false, thurs: true, fri: true, time_length: 30, cost: 44, start_time: "06:00:00",
//         end_time: "18:00:00"
//     }
// updateParkingLotRate(100001, 1, params).then((output) => {
//     //log("The output of update rate is: ", output)
// }).catch((err) => {
//     //log("There was an error updating parking lot rate ", err);
// })

//Add parking pass test
// addParkingPass(100045, 219, "2020-05-01", "20c20-05-31", 135).then((output) => {
//     //log("The result of adding a parking pass is ", output);
// }).catch((err) => {
//     //log("There was an errror ", err);
// })

//Get parking passes test
// getPassesByField("lot_id", 219).then((output) => {
//     //log("The output is: ", output);
// }).catch((err) => {
//     //log("There was an error, ", err);
// })

//Add transaction test
// addTransaction(2345678, 456, '2004-10-19 10:23:54', '2004-10-19 10:53:54' ).then((output) => {
//     //log("The result of adding a transaction is: ", output);
// })
//Get transactions test
// getTransactionsByField('account_num', 100013).then((result) => {
//     //log("THe result of getting transactions is ", result);
// }).catch((err) => {
//     //log("There was an error");
// })

///Add rate test
// const params = {
//     lot_id: 219, mon: true, tues: true, wed: false, thurs: true, fri: true, time_length: 30, cost: 4, start_time: "18:00:00",
//     end_time: "06:00:00"
// }
// const params = {
//     lot_id: 219, sat: true, sun: true, time_length: 35, cost: 5, start_time: "06:00:00", end_time: "18:00:00"
// }
// const params = {
//     lot_id: 219, cost: 175, day_length: 30
// }
// const params = {
//     day: "1999-01-08", time_length: 90, cost: 5, start_time: "18:00:00", end_time: "06:00:00", lot_id: 219
// }
// addParkingRate(4, params).then((output) => {
//     log("The output of the add rate query is: ", output);
// });

// getUserByPhone(4164107939).then((ret) => {
//     //log("The result is: ", ret);
// })

// //////// //logIN TEST /////////////////
// //loginUser("usertest3@gmail.com", "abc123").then((result) => {
//     //log("This is result: ", result)
// }).catch((error) => {
//     //log("This is error: ", error)
// })

///////// SIGNUP TEST //////////////
// const newUser = {
//     email: "usertestYOOHOO@gmail.com",  // Email needs to be different for every signup
//     password: "abc123",
//     firstName: "William",
//     lastName: "Nylander",
//     phoneNum: 64700444007,         // PhoneNum needs to be different for every signup
//     accountType: "plm"
// }
// addNewUser(newUser).then((result) => {
//     //log(result)
// }).catch((error) => {
//     //log(error)
// })

///////// PARKING LOT TEST //////////////
// const newParkingLot = {
//     lotName: "Drive Drive!",
//     address: "3827 Random Street",
//     capacity: 150,
//     type: "underground",
//     restriction: "No big trucks",
//     description: "Right next to the Ferry rides in Toronto Island"
// }
// addParkingLot(100062, newParkingLot).then((result) => {
//     //log(result)
// }).catch((error) => {
//     //log(error)
// })

//License plate test:
// getUserByEmail("matthews@gmail.com").then((user) => {
//     return user.account_num;
// }).then((account_num) => {
//     //return getPlatesFromAccountNum(account_num);
//     return addLicensePlateNum(account_num, "CheQ 421");
// }).then((returnVal) => {
//     //log("Successfully returning: ", returnVal);
// }).catch((err) => {
//     //log("There was an error, ", err);
// });

////GET plates by field test
// getPlatesByField('license_num', 'CORVETTE').then((output) => {
//     log("The output is: ", output);
// }).catch((err) => {
//     log("There was an error: ", err);
// })

//------------------------------------------- MODULE EXPORTS --------------------------------------------





module.exports = {
    db: db,
    getTransactionsByField: getTransactionsByField,
    getUserByEmail: getUserByEmail,
    addNewUser: addNewUser,
    loginUser: loginUser,
    getUserByAccountNum: getUserByAccountNum,
    getUserByEmail: getUserByEmail,
    getUserByPhone: getUserByPhone,
    addParkingRate: addParkingRate,
    addTransaction: addTransaction,
    addLicensePlateNum: addLicensePlateNum,
    updateParkingLotRate: updateParkingLotRate,
    deleteLPNumByField: deleteLPNumByField,
    addParkingLot: addParkingLot,
    getParkingLotByField: getParkingLotByField,
    addParkingPass: addParkingPass,
    getAllTransactionsForPLM: getAllTransactionsForPLM,
    checkConflictingPass: checkConflictingPass,
    getPlatesByField: getPlatesByField,
    updateTransactionsByField: updateTransactionsByField,
    deleteUserByField: deleteUserByField,
    updateLPByAccountNum: updateLPByAccountNum,
    deleteParkingLotById: deleteParkingLotById,
    updateParkingLotByID: updateParkingLotByID,
    getPassesByField: getPassesByField,
    updateUserByField: updateUserByField,
    formatLPNum: formatLPNum,
    retrieveAndIncrementCounter: retrieveAndIncrementCounter,
    getParkingRatesByField: getParkingRatesByField,
    updatePW: updatePW
};