const db = require('./db_conn_client/db_connector')
const bcrypt = require('bcrypt')
const log = console.log;
const ADMIN_ACCOUNT_NUM = 100;

// db.pool.end(() => {
//     //log('pool has ended')
// })

////////////////////////////HELPERS///////////////////////////////////////////////////////////////////////////////////////////

//Helper function to make the db query asyncronously; do not call directly.

const dbQueryHelper = (queryStruct) => {
    /**
     * Given a queryStruct containing name, query text, and values, this function performs the query and rejects 
     * with err on query failure, or resolves with the db output on success.
     */

     return db.pool.connect().then((client) => {
         //return Promise.all([client, client.query(queryStruct)]);
         return client.query(queryStruct).then((output) => {
             client.release();
             return output;
         }).catch((err) => {
             client.release();
             log("There was an error in dbQueryHelper: ", err);
             return Promise.reject(err);
         })
     }).then((output) => {
        return Promise.resolve(output);
     }).catch((err) => {
        log("Error in queryHelper ", err);
        return Promise.reject(err);
     })
}

const hashPassword = (password) => {
    /**
     * Function to hash a password. Returns the password if hashed successfully else NULL.
     * e.g. hashPassword('abc123');
     */
    return bcrypt.hash(password, 10).then((hash) => {
        return hash;
    }).catch((err) => {
        log("Error when hashing the pw: ", err);
        return null;
    })
}

const addPassword = (account_num, password) => {
    /**
     * A function to add a password to the db; used for testing purposes only. BE VERY CAREFUL WHEN USING THIS
     */
    return hashPassword('password123').then((hashed) => {
        const newPasswordQuery = {
            name: 'savePassword',
            text: 'INSERT INTO "BreezeParking"."Password"("account_num", "password") VALUES ($1, $2)',
            values: [100, hashed]
        }
        return dbQueryHelper(newPasswordQuery).then((output) => {
            return output;
        }).catch((err) => {
            log("There was an error when adding new pw to db ", err);
            return Promise.reject(1);
        })
    })
}


const comparePasswords = (hash, password) => {
    /**
     * Compares passwords to see if they are equal. Returns a boolean.
     */
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
    client.release();
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

const checkConflictingRates = (type, params, queryName = "retrieveRatesQuery") => {
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
    const retrieveQuery = {
        name: queryName,
        text: 'SELECT * FROM "BreezeParking"."' + table + '" WHERE lot_id = $1',
        values: [params.lot_id]
    }
    return dbQueryHelper(retrieveQuery).then((result) => {
        return result.rows; //Returns the actual items
    }).then((entries) => {
        return func(params, entries);
    }).catch((err) => {
        log('There was an error when checking for rate conflicts ', err);
        return true;
    })
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
    /**
     * Given an account number, this function returns the associated user struct, else null or undefined if not found.
     * E.g. getUserByAccountNum(100107);
     */
    const accountQuery = {
        name: "accountToUserData",
        text: 'SELECT * FROM "BreezeParking"."User" WHERE account_num = $1',
        values: [accountNum]
    };
    return dbQueryHelper(accountQuery).then((res) => {
        return Promise.resolve(res.rows[0]);
    }).catch((err) => {
        log("There was an error with getting a user by account number: ", err);
        return null;
        })

}

const getBannedUsers = (queryName) => {
    /**
     * A function to get all the banned user structs currently within the database.
     * e.g. getBannedUsers() would return an array of banned user structs
     */
    const bannedQuery = {
        name: queryName,
        text: 'SELECT * FROM "BreezeParking"."User" WHERE active=false'
    }
    return dbQueryHelper(bannedQuery)
    .then(result => {
        log(result.rows)
        return Promise.resolve(result.rows);
    })
    .catch(error => {return Promise.reject(error)});
}

const getUserByEmail = (email) => {
    /**
     * Function to get a user by email; returns the struct with user info if email found else null, or err if 
     * there was a db error.
     * e.g. getUserByEmail('mats.sundin@gmail.com');
     */
    const emailQuery = {
        name: "EmailQuery",
        text: 'SELECT * FROM "BreezeParking"."User" WHERE email = $1',
        values: [email]
    }
    return dbQueryHelper(emailQuery).then((res) => {
        log(res.rows);
        if (res.rows.length == 1) {
            return Promise.resolve(res.rows[0]);
        }
        else if (res.rows.length > 1) {
            log("ERROR: There are multiple users with the same email...")
            return Promise.resolve(res.rows[0]);
        }
        else {
            log("There is no user with such an email.");
            return Promise.reject(null);
        }
    }).catch((err) => {
        log("There was an error when getting a user by email: ", err);
        return Promise.reject(err);
    })
}

const getUserByPhone = (phone) => {
    /**
     * Function to get a user by phone; returns the struct with user info if phone found else null.
     */

    const phoneQuery = {
        name: "phoneQuery",
        text: 'SELECT * FROM "BreezeParking"."User" WHERE phone_num = $1',
        values: [phone]
    }
    return dbQueryHelper(phoneQuery).then((res) => {
        log(res.rows);
        if (res.rows.length == 1) {
            return res.rows[0];
        }
        else if (res.rows.length > 1) {
            log("ERROR: There are multiple users with the same phoneNum...")
            return res.rows[0];
        }
        else {
            log("No user found with this phone number");
            return null;
        }
    }).catch((err) => {
        log("There was an error when getting user by phoneNum, ", err);
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
    dbQueryHelper(deleteUserQuery).then((output) => {
        return 0;
    }).catch((err) => {
        log("There was an error on deleteUserQuery,", err);
        return Promise.reject(1);
    })
}

deleteUserByField('phone_num', 57689);

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

    return dbQueryHelper(updateRate).then((result) => {
        return 0;
    }).catch((err) => {
        log("There was an error when updating lot rate ", err);
        return Promise.reject(1);
    });
}

const addParkingRate = (type, params) => {
    /**
     * Type: 1 = weekday, 2 = weekend, 3 = longterm, 4 = special
     * Params: A struct that should contain all the parameters for the specific addition in order. See the tableQueries to see
     * the necessary parameters.
     * Sample call: addParkingRate(1,  { lot_id: 219, mon: true, tues: true, wed: false, thurs: true,
     *  fri: true, time_length: 300, cost: 4, start_time: "06:00:00", end_time: "18:00:00"})
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
    return checkConflictingRates(type, params, queryName = "checking" + type + "conflict").then((conflict) => {
        if (conflict) {
            log("There was an error; proposed rate conflicts with what's already in the db");
            return Promise.reject(-2);
        }
        const addQuery = {
            name: "add" + type + "Rate",
            text: tableQueries[type],
            values: paramsLists[type]
        }
        return dbQueryHelper(addQuery);
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
    return dbQueryHelper(rateSearchQ).then((results) => {
        log(results.rows);
        return results.rows;
    }).catch((err) => {
        log("There was an error when getting rates by field ", err);
        return Promise.reject(1);
    })
}

//////////////////////////////////////////////////////////////////User Functions///////////////////////////////////////////////


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
     * Given a field in ['account_num', 'phone_num', 'email'] and value for this field, as well as a struct such as 
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
        if (updateStruct.hasOwnProperty(key) && ['phone_num', 'email', 'first_name', "last_name", 'active'].indexOf(key) >= 0) {
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
    //log("The queryText is: ", queryText);
    const updateUserQuery = {
        name: queryName,
        text: queryText,
        values: [value]
    }
    return dbQueryHelper(updateUserQuery).then((output) => {
        return Promise.resolve(output);
    }).catch((err) => {
        log("There was an error when updating user props ", err);
        return Promise.reject(1);
    })
}

const setUserActive = (userID, active) => {
    /**
     * This function bans/unbans a user. The userID is an account number, and the active parameter specifies whether
     * the caller wants this user to be active or inactive. If the UserID is already banned, and the caller is trying to ban 
     * them again, error code -1 is returned. -2 code is returned for other errors. Return code 0 if there are no errors.
     * E.g. banUser(100232, false) bans the user with account number 100232
     */
    const updateStruct = {"active": active};
    return getUserByAccountNum(userID).then((user) => {
        if (user == null){
            return Promise.reject("User to ban does not exist!");
        }
        else if (user["active"] == active){
            log("The user to ban is: ", user);
            log("The ban value is: ", active);
            return Promise.reject(-1);
        }
        else{
            return updateUserByField('account_num', userID, updateStruct);
        }
    }).then((output) => {
        if(output == 1 || output == 2){
            return Promise.reject(-2);
        }
        return Promise.resolve(0);
    }).catch((err) => {
        
        if (err == -1){
            log("User is already disabled: setUserActive Function");
            return Promise.reject(err);
        }
        log("There was an error when banning/unbanning a user ", err);
        return Promise.reject(-2);
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
        return dbQueryHelper(updatePWQuery);
    }).then((output) => {
        return Promise.resolve(output);
    }).catch((err) => {
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
    }).then((curAssociatedAcc) => {
        if (curAssociatedAcc != -1 && curAssociatedAcc != accountNum) {
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
        return dbQueryHelper(lpQuery);
    }).then((res) => {
        return Promise.resolve({ status: 0, msg: "Success" });
    }).catch((err) => {
        log("Error with LP query ", err);
        return Promise.reject({ status: -1, msg: err });
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

    return dbQueryHelper(deleteLpQuery).then((result) => {
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
    const platesByFieldQuery = {
        name: queryName,
        text: 'SELECT * FROM "BreezeParking"."LicensePlates" WHERE ' + field + ' = $1',
        values: [value]
    }
    return dbQueryHelper(platesByFieldQuery).then((res) => {
        log(res.rows);
        return res.rows;
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
     * E.g. addTransaction(100107, 219, new Date(), new Date(), 11);
     */
    const addTransaction = {
        name: "addTransaction",
        text: 'INSERT INTO "BreezeParking"."Transactions"("account_num", "lot_id", "time_entered", "time_exited", "cost") VALUES($1, $2, $3, $4, $5)',
        values: [account_num, lot_id, time_entered, time_exited, cost]
    }
    return dbQueryHelper(addTransaction).then((result) => {
        return Promise.resolve(0);
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
    const getTransactions = {
        name: "getTransactions",
        text: queryText,
        values: [value]
    }
        return dbQueryHelper(getTransactions).then((result) => {
        //log("The result is: ", result.rows);
        return Promise.resolve(result.rows);
    }).catch((err) => {
        log("There was an error when getting transactions by field, ", err);
        return Promise.reject();
    })
}

const getTransactionsForTimeRange = (field, val, start_date, end_date, incompleteOnly = false) => {
    /**
     * Given a field \in ['account_num', 'lot_id', 'trans_id' or 'cost'], an associated value for that field, 
     * a start date, and an end date, this function returns the matching transactions in which the users entry time
     * was at least start date and at most end date.
     * e.g. getTransactionsForTimeRange('account_num', 100013, new Date(2004, 09, 18, 00, 00, 00, 00),
     *  new Date(2020, 02, 25, 19, 40, 00, 00));
     */

     return getTransactionsByField(field, val, incompleteOnly).then((rows) => {
         //log("Intially, the rows are ", rows);
         //log("THe start date is ", start_date);
         //log("The end date is ", end_date);
         return rows.filter((row) => {
             return row.time_entered >= start_date && row.time_entered <= end_date;
         });
     }).then((filteredResults) => {
         //log("Filtered rows are ", filteredResults);
         return Promise.resolve(filteredResults);
     }).catch((err) => {
         log("There was an error when getting filtered transactions ", err);
         return Promise.reject(1);
     })
}

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
        return dbQueryHelper(plmTransactionsQuery);
    }).then((result) => {
        return result.rows;
    }).catch((err) => {
        log("Error in executing query ", err);
        return Promise.reject(1);
    });
}

const getPLMTransactionsForTimeRange = (accountNum, start_date, end_date) => {
    /**
     * Given a PLM account number, and a start and end date, this function returns the relevant transactions.
     * Returns 1 on db error else a list of the transactions.
     * e.g. getPLMTransactionsForTimeRange(100317, new Date(2004, 09, 18, 00, 00, 00, 00),
     * new Date(2019, 02, 22, 19, 40, 00, 00));
     */

    return getAllTransactionsForPLM(accountNum).then((rows) => {
        //log("Intially, the rows are ", rows);
        //log("THe start date is ", start_date);
        //log("The end date is ", end_date);
        return rows.filter((row) => {
            return row.time_entered >= start_date && row.time_entered <= end_date;
        });
    }).then((filteredResults) => {
        log("Filtered rows are ", filteredResults);
        return Promise.resolve(filteredResults);
    }).catch((err) => {
        log("There was an error when getting filtered transactions for PLM ", err);
        return Promise.reject(1);
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
    if (['trans_id'].indexOf(field) < 0) { //For now just search by trans_id to avoid accidentally screwing up the db.
        log("You entered an invalid column to search by");
        return Promise.reject(2);
    }
    const propertiesList = [];
    const valuesList = [];
    updateStruct["time_exited"] = new Date();
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
    const updateTransQuery = {
        name: queryName,
        text: queryText,
        values: [value]
    }
    return dbQueryHelper(updateTransQuery2).then((output) => {
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
    return dbQueryHelper(conflictingPassQuery).then((result) => {
        const rows = result.rows;
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
     * Returns 2 on conflict, error on db error, or db output on success.
     */
    const addPass = {
        name: "addPass",
        text: 'INSERT INTO "BreezeParking"."ParkingPasses"("account_num", "lot_id", "start_date", "end_date", "cost") VALUES($1, $2, $3, $4, $5) ',
        values: [account_num, lot_id, start_date, end_date, cost]
    }
        
    return checkConflictingPass(account_num, lot_id, start_date, end_date).then((conflict) => {
        if (conflict){
            log("There was a conflict; user has a parking pass for this lot for this time period");
            return Promise.reject(2);
        }
        return dbQueryHelper(addPass);
    }).then((result) => {
        log("resolving");
        return Promise.resolve(result);
    })
    .catch((err) => {
        log("There was an error, ", err);
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
    const getPasses = {
        name: "getPasses",
        text: 'SELECT * FROM "BreezeParking"."ParkingPasses" WHERE ' + field + ' = $1',
        values: [value]
    }
    return dbQueryHelper(getPasses).then((result) => {
        log(result.rows);
        return result.rows;
    }).catch((err) => {
        log("There was an error when getting passes, ", err);
        return Promise.reject(1);
    })
}

const removeParkingPass = (passID, queryName = "removepp") => {
    /**
     * Remove the parking pass passID
     * Sample call: removeParkingPass(100004);
     * 
     */
    const queryText = 'DELETE FROM "BreezeParking"."ParkingPasses" WHERE pass_id = $1';
    const queryStruct = {
        name: queryName,
        text: queryText,
        values: [passID]
    }
    return dbQueryHelper(queryStruct).then((output) => {
        return Promise.resolve(0);
    }).catch((err) => {
        return Promise.reject(-1);
    });
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
                    addRequest(accountNum, ADMIN_ACCOUNT_NUM, 'parking lot request', res.rows[0][0], null, "").then((output) =>{
                        respondWith(client, 0, res.rows[0][0], resolve)
                    }).catch((err) => {
                        log("Error when generating new parking lot request ", err);
                        respondWith(client, 1, "Error in generating parking lot request in database.", reject)
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
    return dbQueryHelper(searchQuery).then((result) => {
        return result.rows;
    }).catch((err) => {
        log("There was an error when getting parking lots by field ", err);
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
     * Returns 1 on db error, 2 on invalid params, and db output on success.
     */
    const propertiesList = [];
    const valuesList = [];
    for (let key in lotInfo) {
        if (lotInfo.hasOwnProperty(key) && ['capacity', 'restriction', 'description', "lot_name", 'num_occupant',
            'active'].indexOf(key) >= 0) {
            propertiesList.push(key);
            valuesList.push(lotInfo[key]);
        }
        else {
            log("Invalid property found when updating parkinglot by ID...continuing");
        }
    }
    if (propertiesList.length == 0 || valuesList.length == 0 || propertiesList.length != valuesList.length){
        log("All your proposed properties to change were invalid!");
        return Promise.reject(2);
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
    const updateParkingLotQuery = {
        name: queryName,
        text: queryText,
        values: [lotID]
    }
    return dbQueryHelper(updateParkingLotQuery).then((output) => {
        return Promise.resolve(output);
    }).catch(error => {
        log("There was an error when updating user props ", error);
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
    return dbQueryHelper(deleteLotQuery).then((output) => {
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
    return dbQueryHelper(retrieveQuery).then((output) => {
        const counterVal =  output.rows[0];
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
        return dbQueryHelper(counterQuery).then((output) => {
            //log("The output is ", output);
            //NOTE: USe output.rows to get the new counter value if need be.
            return counterVal;
        }).catch((err) => {
            return Promise.reject(err);
        })
    }).then((counterValue) => {
        return counterValue;
    }).catch((err) => {
        log("There was an error when getting and incrementing counter: ", err);
        return Promise.reject(err);
    })
}

///////////////////////////////////////////////REQUESTS FUNCTIONS////////////////////////////////////////////////////////////////
const addRequest = (from_acc, to_acc, type, title, related_acc, description, resolved = false, queryName = 'newRequest') => {
    /**
     * Given a from account, to account, type, title, related_account (if applicable) and a description, this function
     * adds a new, unresolved request to the database. From_acc, to_acc, and related_acc are user account numbers; 
     * description and title are strings;
     * type \in ['bug report', 'ban request', 'parking lot request', 'other'];
     * related_acc should be NULL if this is not a ban request.
     * Returns 0 on db success, 1 on db failure, or 2 on invalid params.
     * E.g. addRequest(100013, ADMIN_ACCOUNT_NUM, 'ban request', 'meat', 100013, 'veg ftw')
     */
    if (['bug report', 'ban request', 'parking lot request', 'other'].indexOf(type) < 0){
        log("Invalid type supplied!");
        return Promise.reject(2);
    }

    if(type == 'ban request' && related_acc == null){
        log("You must state the user account who you want to ban!");
        return Promise.reject(2);
    }

    const queryText = 'INSERT INTO "BreezeParking"."Requests"(from_acc, to_acc, type, title, related_acc, description, \
        resolved, add_date, update_date)\
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    const queryStruct = {
        name: queryName,
        text: queryText,
        values: [from_acc, to_acc, type, title, related_acc, description, resolved, new Date(), new Date()]
    }
    return dbQueryHelper(queryStruct).then((output) => {
        return Promise.resolve(0);
    }).catch((err) => {
        log("There was an error ", err);
        return Promise.reject(1);
    });
}

const getRequestsByField = (fieldValStruct, queryName = 'requestsSearch') => {
    /**
     * Given a fieldValStruct with keys
     * \in ['req_id', 'from_acc', 'to_acc', 'type', 'title', 'related_acc', 'description', 'resolved'], this
     * function retrieves the requests which fit the search criteria. Returns list of the results on success, 1 on db error,
     * or 2 on invalid keys in the fieldValStruct.
     * E.g. getRequestsByField({'from_acc': 100013, 'to_acc': 100, 'type': 'ban request'})
     */
    const validProps = ['req_id', 'from_acc', 'to_acc', 'type', 'title', 'related_acc', 'description', 'resolved', 
    'add_date', 'update_date'];
    const propertiesList = [];
    const valuesList = [];
    for (let key in fieldValStruct) {//Check the keys to make sure that they are proper.
        if (fieldValStruct.hasOwnProperty(key)) {
            if (validProps.indexOf(key) < 0) {
                log("There was an invalid property in the fieldValStruct!");
                return Promise.reject(2);
            }
            else{
                propertiesList.push(key);
                valuesList.push(fieldValStruct[key]);
            }
        }
    }
    let queryText = 'SELECT * FROM "BreezeParking"."Requests" ';
    queryText += ' WHERE ';
    for (let i = 0; i < propertiesList.length - 1; i++) {

        queryText += propertiesList[i];
        queryText += ' = \'';
        queryText += valuesList[i];
        queryText += '\' AND ';
    }
    queryText += propertiesList[propertiesList.length - 1];
    queryText += ' = \'';
    queryText += valuesList[propertiesList.length - 1];
    queryText += '\'';
    //queryText += ' WHERE ' + field + " = $1";
    //log(queryText);
    const queryStruct = {
        name: queryName,
        text: queryText,
        values: []
    }
    return dbQueryHelper(queryStruct).then((output) => {
        //log(output.rows);
        return Promise.resolve(output.rows);
    }).catch((err) => {
        log("Error occurred when searching requests: ", err);
        return Promise.reject(1);
    })
}

const deleteRequest = (reqID, queryName = "deleteReq") => {
    /**
     * Given the id of a request to delete, this function deletes the request. Returns 0 on success, or 1 on 
     * db error.
     * E.g. deleteRequest(100007);
     */
    const queryText = 'DELETE FROM "BreezeParking"."Requests" WHERE req_id = $1';
    const queryStruct = {
        name: queryName,
        text: queryText,
        values: [reqID]
    }

    return dbQueryHelper(queryStruct).then((output) => {
        return Promise.resolve(0);
    }).catch((err) => {
        log("There was an error when deleting request ", err);
        return Promise.reject(1);
    })
}

const updateRequestEditDate = (field, value, queryName = "updateReqEditDate") => {
    /**
     * HELPER FN - Given a field and a value, this function updates all of the request updated dates.
     * See validProps list to see the list of valid fields to specify.
     * e.g. updateRequestEditDate('req_id', 100000);
     * 
     */
    const validProps = ['req_id', 'from_acc', 'to_acc', 'type', 'title', 'related_acc', 'description', 'resolved', 'add_date',
    'update_date'];
    if (validProps.indexOf(field) < 0){
        log("Invalid field specified");
        return Promise.reject(2);
    }
    const queryText = 'UPDATE "BreezeParking"."Requests" SET add_date = $1 WHERE ' + field + ' = $2';
    const queryStruct = {
        name: queryName,
        text: queryText,
        values: [new Date(), value]
    }

    return dbQueryHelper(queryStruct).then((output) => {
        return Promise.resolve(0);
    }).catch((err) => {
        log("Error occurred when updating requests: ", err);
        return Promise.reject(1);
    })
}

const updateRequest = (field, value, updateStruct, queryName = "updateRequest") => {
    /**
     * Given a field such as req_id and a value such as 100006, as well as an object with key value pairs of fields 
     * to update, this function updates the matching transaction(s). Returns 0 on success, 1 on db error or 2 on 
     * invalid params.
     * updateStructs keys \in ['req_id', 'from_acc', 'to_acc', 'type', 'title', 'related_acc', 'description', 'resolved']
     * E.g. updateRequest('req_id', 100006, {"resolved": true});
     */
    const validProps = ['req_id', 'from_acc', 'to_acc', 'type', 'title', 'related_acc', 'description', 'resolved'];
    const propertiesList = [];
    const valuesList = [];
    for (let key in updateStruct) {//Check the keys to make sure that they are proper.
        if (updateStruct.hasOwnProperty(key)) {
            if (validProps.indexOf(key) < 0) {
                log("There was an invalid property in the updateStruct!");
                return Promise.reject(2);
            }
            else{
                propertiesList.push(key);
                valuesList.push(updateStruct[key]);
            }
        }
    }


    let queryText = 'UPDATE "BreezeParking"."Requests" ';
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
    queryText += ' WHERE ' + field + " = $1 ";
    queryText += "RETURNING from_acc";
    const queryStruct = {
        name: queryName,
        text: queryText,
        values: [value]
    }
    return dbQueryHelper(queryStruct).then((output) => {
        return Promise.all([output, updateRequestEditDate(field, value)]);
    }).then((output) => {
        return Promise.resolve(output[0]);
    })
    .catch((err) => {
        log("Error occurred when updating requests: ", err);
        return Promise.reject(1);
    })
}

const approveBanRequest = (request) => {
    /**
     * Given a ban request, this function takes the appropriate steps when an admin decides to ban a user based on this ban 
     * request. These steps are to deactivate the user, update the ban request, and send a message back to the requesting
     * PLM that their query has been satisfied.
     * Returns 0 on success, 1 on db error, or 2 on invalid ban request.
     * E.g. approveBanRequest({
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
        });
     */

    if (request['type'] != 'ban request'){
        log("This is not a ban request!");
        return Promise.reject(2);
    }
    return setUserActive(request['related_acc'], false).then((output) => {
        return updateRequest('related_acc', request['related_acc'], {'resolved': true});
    }).then((result) => {

        //log("The result.rows is: ", result.rows);
        const formattedRows = result.rows.map((row) =>{
            return row['from_acc'];
        })
        //log("The formatted row is ", formattedRows);
        const usersSatisfied = formattedRows.filter((id) => {
            return id != ADMIN_ACCOUNT_NUM;
        })
        //log("The users satisfied is: ", usersSatisfied);

        const uniq = [...new Set(usersSatisfied)];
        //log("The users satisfied without duplicates is ", uniq);
        promisesToSolve = [];
        for (let i = 0; i < uniq.length; i++){
            promisesToSolve.push(
                addRequest(ADMIN_ACCOUNT_NUM, uniq[i], request['type'], "Ban request approved!", 
        request['related_acc'], "Based on your request to ban the user with account number " + request['related_acc'] + 
        ", we have decided to ban this user from Breeze Parking.", resolved=true)
            );
        }
        return Promise.all(promisesToSolve);
    }).then((output) => {
        return Promise.resolve(0);
    }).catch((err) => {
        log("There was an error when applying a ban to a user ", err);
        return Promise.reject(1);
    })
}

// approveBanRequest({ req_id: 100077,
//     from_acc: 100107,
//     to_acc: 100,
//     type: 'ban request',
//     title: 'meat',
//     related_acc: 100198,
//     description: 'veg ftw',
//     resolved: false,
//     add_date: "2020-04-09T04:00:00.000Z",
//     update_date: "2020-04-09T04:00:00.000Z" })

// addRequest(100013, ADMIN_ACCOUNT_NUM, 'ban request', 'meat', 100198, 'veg ftw');
// addRequest(100107, ADMIN_ACCOUNT_NUM, 'ban request', 'meat', 100198, 'veg ftw');
// addRequest(100013, ADMIN_ACCOUNT_NUM, 'ban request', 'meat', 100198, 'veg ftw');
// addRequest(100013, ADMIN_ACCOUNT_NUM, 'ban request', 'meat', 100198, 'veg ftw');
// addRequest(100013, ADMIN_ACCOUNT_NUM, 'ban request', 'meat', 100198, 'veg ftw');
// getRequestsByField({'from_acc': 100107, 'to_acc': 100, 'type': 'ban request'}).then((output) => {
//     log("The output is: ", output);
// })

const resolveOtherRequest = (request) => {
    /**
     * Given a other request, this function takes the appropriate steps when the admin finishes resolving the bug request. The
     * request is a request object.
     * E.g. resolveOtherRequest({
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
        });
        Returns 0 on success, 1 on db error or 2 on invalid params.
     */
    if (request['type'] != 'other'){
        log("This is not a other request!");
        return Promise.reject(2);
    }
    return updateRequest('req_id', request['req_id'], {'resolved': true}).then((output) => {
        return addRequest(ADMIN_ACCOUNT_NUM, request['from_acc'], request['type'], "Request Resolved!", 
        request['related_acc'], "Your request called  " + request['title'] + 
        " has been resolved.", resolved=true); 
    }).then((result) => {
        return Promise.resolve(0);
    }).catch((err) => {
        log("There was an error when resolving a other request ", err);
        return Promise.reject(1);
    })
}

const resolveBugRequest = (request) => {
    /**
     * Given a bug request, this function takes the appropriate steps when the admin finishes resolving the bug request. The
     * request is a request object.
     * E.g. resolveBugRequest({
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
        });
     * Returns 0 on success, 1 on db error or 2 on invalid params.
     */
    if (request['type'] != 'bug report'){
        log("This is not a bug report!");
        return Promise.reject(2);
    }
    return updateRequest('req_id', request['req_id'], {'resolved': true}).then((output) => {
        return addRequest(ADMIN_ACCOUNT_NUM, request['from_acc'], request['type'], "Bug fix complete!", 
        request['related_acc'], "Based on your bug report  " + request['title'] + 
        ", we have resolved the issue. Thank you for your report!", resolved=true); 
    }).then((result) => {
        return Promise.resolve(0);
    }).catch((err) => {
        log("There was an error when resolving a bug request ", err);
        return Promise.reject(1);
    })
}

const resolveAddLotRequest = (request) => {
    /**
     * Given a lot request that the parking lot manager wishes to approve, this function makes the related parking lot active
     * after checking that it exists, and sends a msg/ resolved request to the user who owns the lot.
     * Returns 0 on success, 1 on db error, or 2 on invalid params or request title.
     * E.g. resolveAddLotRequest({
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
        });
     */
    if (request['type'] != 'parking lot request'){
        log("This is not a parking lot request!");
        return Promise.reject(2);
    }

    return getParkingLotByField('lot_id', request['title']).then((output) => {
        log("The output is ", output);
        if (output.length != 1){
            log("Error, the lot id was not related to one lot,  ", output);
            return Promise.reject(2);
        }
        return updateParkingLotByID(request['title'], {"active": true});
    }).then((result) => {
        return updateRequest('title', request['title'], {'resolved': true});
    }).then((updateReqResult) => {
        return addRequest(ADMIN_ACCOUNT_NUM, request['from_acc'], request['type'], "Parking lot approved!", 
        request['related_acc'], "Your parking lot with id  " + request['title'] + 
        " has been approved.", resolved=true);
    })
    .then((finalResult) => {
        return Promise.resolve(0);
    }).catch((err) => {
        log("There was an error when resolving the add parking lot request ", err);
        return Promise.reject(2);
    })
}

const getRequestsForTimeRange = (fieldValStruct, start_date, end_date) => {
    /**
     * Given a request struct, and a start and end date, this function returns the relevant requests.
     * Returns 1 on db error else a list of the transactions.
     * getRequestsForTimeRange({'from_acc': 100013, 'to_acc': 100, 'type': 'ban request'}, 
     * new Date(2004, 08, 22, 00, 00, 00, 00), new Date(2024, 08, 22, 00, 00, 00, 00))
     */

    return getRequestsByField(fieldValStruct).then((rows) => {
        //log("Intially, the rows are ", rows);
        //log("THe start date is ", start_date);
        //log("The end date is ", end_date);
        return rows.filter((row) => {
            return row.add_date >= start_date && row.add_date <= end_date;
        });
    }).then((filteredResults) => {
        log("Filtered rows are ", filteredResults);
        return Promise.resolve(filteredResults);
    }).catch((err) => {
        log("There was an error when getting filtered requests ", err);
        return Promise.reject(1);
    })
}

/////////////////////////////////////////////////PARKING FARE CALCULATIONS///////////////////////////////////////////////////////

const trimOffMonthlyInterval = (accountNum, lotId, enterTime, exitTime) => {
    /**
     * Given an account number, lot id, entrance time, and exit time, this function trims off the entrance and 
     * exit times which are covered by the user's monthly or yearly etc pass.
     * E.g. trimOffMonthlyInterval(2345678, 253, new Date("2020-03-17T14:23:54.000Z"), new Date("2020-03-18T14:23:54.000Z"));
     * Works, but beware of time-zone differences.
     * 
     */
    const parkingPassQuery = {
        name: 'parkingPassQuery',
        text: 'SELECT * FROM "BreezeParking"."ParkingPasses" WHERE account_num = $1 AND lot_id = $2',
        values: [accountNum, lotId]
    }
    return db.pool.connect().then((client) => {
        return client.query(parkingPassQuery).then((output) => {
            client.release();
            return output.rows;
        }).catch((err) => {
            log("Error when querying and releasing client ", err);
            return Promise.reject(1);
        })
    }).then((output) => {
        output2 = output.map((entry) => {
            entry.start_date.setHours(0);
            entry.start_date.setMinutes(0);
            entry.start_date.setSeconds(0);
            entry.end_date.setHours(23);
            entry.end_date.setMinutes(59);
            entry.end_date.setSeconds(59);
            log("Entry start date is: ", entry.start_date.toString());
            log("Entry end date is: ", entry.end_date.toString());
            return entry;
        })
        const overlappingRanges = output.filter((entry) => {
            return (enterTime >= entry.start_date && enterTime < entry.end_date) || 
            (exitTime > entry.start_date && exitTime <= entry.end_date);
        })
        //There should be few overlapping time ranges, especially after we implement the db check for conflicting passes
        for (let i = 0; i < overlappingRanges.length; i++){
            log("The overlapping ranges [i].start_date is: ", overlappingRanges[i].start_date);
            log("The overlapping ranges [i].end_date is: ", overlappingRanges[i].end_date);
            if (enterTime >= overlappingRanges[i].start_date && exitTime <= overlappingRanges[i].end_date){
                //If the time that user parked was fully covered by their parking pass
                log("Reached case 1");
                return {enterTime: enterTime, exitTime: enterTime} //There is no more remaining time to account for.
            }
            else if(exitTime >= overlappingRanges[i].start_date && exitTime <= overlappingRanges[i].end_date){
                //If the user entered b4 their pass came into effect but exited during their pass
                log("Reached case 2");
                exitTime = overlappingRanges[i].start_date; //makes it equal to midnight at start of start date
            }
            else if(enterTime >= overlappingRanges[i].start_date && enterTime <= overlappingRanges[i].end_date){
                //If the user entered during the time that their pass was in effect but exited after their pass expired.
                log("Reached case 3");
                enterTime = overlappingRanges[i].end_date;
            }
            else if(enterTime < overlappingRanges[i].start_date && exitTime > overlappingRanges[i].end_date){
                log("This is weird, why was the user parked in the lot for over a month?");
                //TODO: Figure this out.
            }
            else {
                log("This case was missed when trimming times covered by monthly passes...what is this case?");
            }
        }
        return {enterTime: enterTime, exitTime: exitTime};
    })
}

const calculateParkingFare = (transaction, exitTime) => {
    /**
     * Given a transaction object in the form of {trans_id: 100014, account_num: 2345678, lot_id: 253, 
     * time_entered: 2004-10-19T14:23:54.000Z, time_exited: null, cost: null}, and an exit time as a date object, such
     * as 2020-03-18T11:19:41.691Z (optional param) this function calculates the required cost for the user to pay on
     * exit.
     * Assumption 1: They enter and exit on a weekday, and that they dont park on a weekend.
     * Assumption 2: Must have disjoint daily and overnight rates.
     */
    //Call trimOffMonthlyInterval first (we can do this after we confirm that this fn works)
    //Get the parking rates from the weekday table in order to find the critical/borderline times, where the rates change
    //(DONE)
    //By our assumption 2, there should be clear changeover times
    //
    // Then make a list of the critical dates and times.
    //
    // E.g., suppose that there is a lot that defines from 6am to 6pm as one interval, and then 6pm to 6am as the other 
    //interval, and then within those intervals there are one or more rates, which we take the minumun of.
    //If a guy shows up on 2020-03-23 at 4pm and leaves on 2020-03-24 at 10am, the critical times are:
    /**
     * 2020-03-23 6pm
     * 2020-03-24 6am
     * 2020-03-24 6pm, since within those intervals, the guy was in the lot.
     * 
     * Then, the critical time ranges are:
     * 2020-03-23 4pm to 6pm
     * 2020-03-23 6pm to 2020-03-24 6am (treat this all as one interval, for the date 2020-03-24 @JunWei this was ur soln)
     * 2020-03-24 6am to 2020-03-24 10am.
     * (DONE, lst changeover times fn below);
     * 
     * Then, for each critical range, there should be a set of at least one or more rates that apply to the range; calculate
     * the minimum cost for each range in the following way:
     * 
     * First, check which is cheapest within the individual rates. If for example they parked for 3.5h, and there is rates
     * for 30min, 4hr, and 12hr, check which one individually can be the cheapest.
     * 
     * If have time, must check combinations of rates: E.g. if parked for 5h, is it cheaper to charge for two 4h periods, or 1 4h
     * period, plus two half hour periods, or 10 half hour periods? USE DYNAMIC PROGRAMMING HERE WITH @Abhi
     * FOR NOW, NO COMBINATIONS OF RATES ALLOWED, WE JUST GIVE THEM THE MINIMUM OF THE INDIVIDUAL RATES FOR NOW.
     */
    //log("The transaction is ", transaction);
    //const entryDate = new Date(transaction["time_entered"]);
    //const exitDate = new Date(exitTime);
    //log("The entrance date is: ", entryDate);
    //log(entryDate.addHours(4));
    //log("The exit time is: ", exitDate);
    //log(new Date(exitDate - entryDate));
    return getCriticalTimes(transaction["lot_id"]).then((criticalTimes) => {
        if (criticalTimes == 1 || criticalTimes == 2){
            return Promise.reject(1);
        }
        return lstChangeoverTimes(criticalTimes, transaction["time_entered"], exitTime);
        
    }).then((changeOverTimes) => {
        /**
         * For each time range, convert the start of the time range to a day of the week, and retrieve all the applicable rates for
         * that day for that lot. 
         * Then, filter down the rates to only leave those that include that time range.
         * From there, for each rate, do the formula that we wrote on whiteboard to figure out the cost using only that rate.
         * Then, take the minimum of those rates.
         * Finally, add up the costs of all the time ranges and return them to the user.
         */
        log("The changeover times are: ", changeOverTimes);
        const promiseList = [];
        for (let i = 0; i < changeOverTimes.length; i++){
            promiseList.push(new Promise(function (resolve, reject) {
                resolve(calculateMinRateForRange(changeOverTimes[i], transaction["lot_id"]));
            }))
        }
        return Promise.all(promiseList);

    }).then((lstOfCharges) => {
        let sum = lstOfCharges.reduce((sum, curr) => {
            return sum + curr;
        }, 0);
        return Promise.resolve(sum);
    }).catch((error) => {
        log("There was an error when calculating fares ", error);
        return Promise.reject(error);
    })
}
// const date2004 = new Date("2020-03-17T14:23:54.000Z");
// const dateVal = date2004.valueOf();
// const date2020 =  new Date("2020-03-18T14:23:54.000Z");
// const dayOnly = new Date("2020-03-18");
// //log(date2020);
// const date2020val = date2020.valueOf();
// //log(date2020val);
// log(date2020val - dayOnly);

function calculateMinRateForRange(timeRange, lotId){
    /**
     * In progress. To be completed.
     */
    return new Promise((resolve, reject) => {
        db.pool.connect().then(client => {
            const lotRateQuery = {
                name: 'lotRateSearch',
                text: 'SELECT * FROM "BreezeParking"."LotRateWeekday" WHERE lot_id = $1',
                values: [lotId]
            }

            client.query(lotRateQuery).then(res => {
                rateEntries = res.rows
                let total = 0
                for (range of timeRange){
                    let costs = []
                    for (entry of rateEntries){
                        // log("range is", range)
                        // log("the start date is", range[0].getDate())
                        // log("the end date is", range[1].getDate())
                        // log(typeof range[0].getDate())
                        // log("entry start_time is", entry.start_time)
                        // log("entry end_time is", entry.end_time)
                        const curHrStrStart = entry.start_time.slice(0,2);
                        const curHrIntStart = parseInt(curHrStrStart);
                        const curMinStrStart = entry.start_time.slice(3,5);
                        const curMinIntStart = parseInt(curMinStrStart);
                        const curSecStrStart = entry.start_time.slice(6,8);
                        const curSecIntStart = parseInt(curSecStrStart);
                        const start = new Date(range[0].getFullYear(), range[0].getMonth(), range[0].getDate(),
                                             curHrIntStart, curMinIntStart, curSecIntStart, 0)
                        const curHrStrEnd = entry.end_time.slice(0,2);
                        const curHrIntEnd = parseInt(curHrStrEnd);
                        const curMinStrEnd = entry.end_time.slice(3,5);
                        const curMinIntEnd = parseInt(curMinStrEnd);
                        const curSecStrEnd = entry.end_time.slice(6,8);
                        const curSecIntEnd = parseInt(curSecStrEnd);
                        const end = new Date(range[1].getFullYear(), range[1].getMonth(), range[1].getDate(),
                                            curHrIntEnd, curMinIntEnd, curSecIntEnd, 0)
                        // log("start is", start)
                        // log("end is", end)
                        // log("\n")
                    }
                }
            }).catch(error => {
                respondWith(client, 1, error, reject)
            })
        }).catch(error => {
            respondWith(client, 1, error, reject)
        })
    })
    return 1;
}


function lstChangeoverTimes(criticalTimes, timeEntered, timeExited){
    /**
     * Given a list of critical times such as [ '18:00:00', '06:00:00' ], a time entered str such as
     * "2020-03-23T14:00:00.000Z", and a time exited string such as "2020-03-24T19:00:00.000Z", this function
     * returns a list of changeOver times between the entry and exit time such as [2020-03-23 6pm,
     * 2020-03-24 6am, 2020-03-24 6pm].
     * This function assumes that THERE ARE ONLY TWO CRITICAL TIMES as per our frontend design
     * e.g. lstChangeoverTimes( [ '18:00:00', '06:00:00' ], "2020-03-23T14:00:00.000Z","2020-03-24T19:00:00.000Z");
     * Returns a list of lists representing time intervals between the enter and exit time such as:
     * [
        [ 2020-03-23T14:00:00.000Z, 2020-03-23T22:00:00.000Z ],
        [ 2020-03-23T22:00:00.000Z, 2020-03-24T10:00:00.000Z ],
        [ 2020-03-24T10:00:00.000Z, 2020-03-24T19:00:00.000Z ]
        ]
     */
    log("Critical times are: ", criticalTimes);
    log("Time entered is: ", timeEntered);
    log("Time exited is ", timeExited);
    if (criticalTimes.length != 2){
        return Promise.reject("Not supported for != 2 changeover times");
    }
    const dateEntered = new Date(timeEntered);
    const dateExited = new Date(timeExited);
    const curDayInt = dateEntered.getDate();
    const curMonthInt = dateEntered.getMonth();
    const curYearInt = dateEntered.getFullYear();
    const critDatesAtDateEntered = []

    for (let i = 0; i < criticalTimes.length; i++){
        const curHrStr = criticalTimes[i].slice(0,2);
        const curHrInt = parseInt(curHrStr);
        const curMinStr = criticalTimes[i].slice(3,5);
        const curMinInt = parseInt(curMinStr);
        const curSecStr = criticalTimes[i].slice(6,8);
        const curSecInt = parseInt(curSecStr);
        critDatesAtDateEntered.push(new Date(curYearInt, curMonthInt, curDayInt, curHrInt, curMinInt, curSecInt, 0));
        
    }
    //log(critDatesAtDateEntered[1] > critDatesAtDateEntered[0]);
    critDatesAtDateEntered.sort((date1, date2) => {
        if (date1 > date2){
            return 1;
        }
        else if (date2 > date1){
            return -1;
        }
        else{
            return 0;
        }
    })
    //log("The critical dates at date entered is: ", critDatesAtDateEntered);
    let firstCriticalDate = null;
    let firstDateIndex = 0;
    for (let i = 0; i < critDatesAtDateEntered.length; i++){
        //log("The date is ", critDatesAtDateEntered[i], " and the date entered is ", dateEntered);
        if (critDatesAtDateEntered[i] >= dateEntered){
            firstCriticalDate = critDatesAtDateEntered[i];
            break;
        }
        firstDateIndex += 1;
    }
    //Here we use the assumption of only two critical times
    const criticalDates2 = critDatesAtDateEntered;
    if (firstCriticalDate == null){// firstDateIndex is 2 here
        firstCriticalDate = critDatesAtDateEntered[0].addHours(24);
        criticalDates2[0] = firstCriticalDate;
        criticalDates2[1] = criticalDates2[1].addHours(24);
    }
    else if (firstDateIndex == 1){
        criticalDates2[0] = criticalDates2[0].addHours(24);
        criticalDates2.sort((date1, date2) => {
            if (date1 > date2){
                return 1;
            }
            else if (date2 > date1){
                return -1;
            }
            else{
                return 0;
            }
        })
    }
    //log("The first critical date is: ", firstCriticalDate);
    //log("The criticalDates2 is ", criticalDates2);
    //At this point, critical dates2 is the next two critical dates after the time the user entered *****
    const timeBlocks = [];
    timeBlocks.push([dateEntered,  new Date(JSON.parse(JSON.stringify(criticalDates2[0])))]);
    //log("Time blocks is initially ", timeBlocks);
    let curSpot = new Date(JSON.parse(JSON.stringify(criticalDates2[0])));
    const intervalOne = criticalDates2[1] - criticalDates2[0];
    const intervalTwo = criticalDates2[0].addHours(24) - criticalDates2[1];
    //log("Cur spot is: ", curSpot);
    //log("Date exited is: ", dateExited);
    let numTimesIncremented = 0;
    while(curSpot < dateExited){
        let prevSpot = new Date(JSON.parse(JSON.stringify(curSpot)));
        if(numTimesIncremented % 2 == 0){
            //curSpot += intervalOne;
            //curSpot = new Date(curSpot + intervalOne);
            curSpot = curSpot.addMillisecs(intervalOne);
            //log("Cur spot is now  ", curSpot);
        }
        else {
            curSpot = curSpot.addMillisecs(intervalTwo);
            //log("Cur spot is now  (i2) ", curSpot);
        }
        timeBlocks.push([prevSpot, new Date(JSON.parse(JSON.stringify(curSpot)))
        ]);
        numTimesIncremented += 1;
        //break;
    }
    timeBlocks[timeBlocks.length - 1][1] = dateExited;
    log("Time blocks is now: ", timeBlocks);
    return timeBlocks;

}

function getCriticalTimes(lotId, queryName = 'criticalTimesQuery'){
    /**
     * Given a lot id, this function returns the critical times, as a list of times of day (not date), such
     * as [ '18:00:00', '06:00:00' ].
     * On error, a Promise.reject(2) is sent on invalid params, or 1 on db error.
     */
    let lotName = "LotRateWeekday";
    const queryText = 'SELECT start_time FROM "BreezeParking"."' + lotName + '" WHERE lot_id = $1' ;
    const criticalTimesQuery = {
        name: queryName,
        text: queryText,
        values: [lotId]
    }
    return db.pool.connect().then((client) => {
        return client.query(criticalTimesQuery).then((output) =>{
            client.release();
            const times = [];
            for (let i = 0; i < output.rows.length; i++){
                times.push(output.rows[i]["start_time"]);
            }
            log("The times in the critical times fn are: ", times);
            return times;
        })
    }).then((times) => {
        const newSet = new Set(times);
        const backToArray = [...newSet];
        return backToArray;
    }).catch((err) => {
        log("Error when finding critical times ", err);
        return Promise.reject(1);
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


// const registerRequest = (request) => {
//     /**
//      * The request object is of the form:
//      * {"topic": str, "description": str, "userID": int, "plmUserID": int, "resolved": boolean}
//      * Return a -1 error code if plmUserID doesnt exist, -2 if userID doesnt exist, -3 if other errors.
//      * Remember to send a error string as a response when rejecting the promise. 
//      * Return a 0 if no errors, with the requestID (generated in DB) in the result pls thx ily 
//      * Return result of the form {"code": int, "reqID": int, "msg": string}
//      */
//     return 0
// }

// const removeParkingPass = (userID, lotID) => {
//     /**
//      * Remove the parking pass of userID
//      * Assumes that a user has only one parking pass running at a time.
//      */
//     return 0;
// }

// const getRequests = (plmID) => {
//     /**
//      * Gets the requests submitted by plmID.
//      */
//     return 0;
// }


// const resolveRequest = (reqID) => {
//     /**
//      * Request reqID is being resolved within this db function.
//      */
//     return 0;
// }

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
    updatePW: updatePW,
    //removeParkingPass: removeParkingPass,
    // NEW FUNCTIONS FROM HERE ON DOWN
    approveBanRequest: approveBanRequest,
    deleteRequest: deleteRequest,
    resolveBugRequest: resolveBugRequest,
    getRequestsByField: getRequestsByField,
    removeParkingPass: removeParkingPass,
    setUserActive: setUserActive,
    getRequestsForTimeRange: getRequestsForTimeRange,
    resolveOtherRequest: resolveOtherRequest,
    resolveAddLotRequest: resolveAddLotRequest, 
    addRequest: addRequest,
    getBannedUsers: getBannedUsers,
    calculateParkingFare: calculateParkingFare
    //registerRequest: registerRequest,
    //getRequests: getRequests,
    //resolveRequest: resolveRequest
};
