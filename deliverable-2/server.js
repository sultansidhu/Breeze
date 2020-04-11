'use strict'
"The main server file for Breeze."

const log = console.log;
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dbInterface = require('./db_interface.js');
const port = 80;
const app = express();
app.use(bodyParser());
app.use(cookieParser());

app.get('/', (req, res) => {
    app.use(express.static("../d2"));
    res.sendFile(path.resolve('../d2/html/index.html'));

});

// Get PLM data routes 
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
    app.use(express.static("../d2"));
    res.sendFile(path.resolve('../d2/html/pricing_weekday.html'));
});

app.get('/pricing-main', (req, res) => {
    app.use(express.static("../d2"));
    res.sendFile(path.resolve('../d2/html/pricing_main.html'));

});

app.get('/get-cookie', (req, res) => {
    res.send(req.cookies);
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

app.get('/dashboard', (req, res) => {
    app.use(express.static("d2"));
    res.sendFile(path.resolve('d2/html/dashboard_user.html'));
})

app.get('/enter-lp-nums', (req, res) => {
    /**
     * This function sends the caller to the signup page for users meant to help them enter their license plate numbers
     * and in the future their payment info.
     */
    app.use(express.static("../d2"));
    res.sendFile(path.resolve("../d2/html/signup_user.html"));

})

app.get('/enter-lot-data', (req, res) => {
    /**
     * This route sends the caller to the page in which they enter information about their parking lot. Meant for PLMs.
     */
    app.use(express.static("d2"));
    console.log("Sending the enter lot data file!");
    res.sendFile(path.resolve('d2/html/signup_plm.html'));
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
        if (req.body.twoPlates){
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

    dbInterface.addParkingRate(type, params).then((dbOutput) => {
        log("THe db output is: ", dbOutput);
        if (dbOutput !== 0) {
            res.status(500).send("Error in adding the lot rate.");
        } else {
            res.status(200).send("Success.");
        };
    }).catch((err) => {
        log("There was an error; ", err);
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

app.post('/remove-lp-num', (req, res) => {
    const lpNum = req.body.lpNum
    dbInterface.deleteLicensePlateNum(lpNum).then(result => {
        res.status(200).send(`Removcal of License Plate number ${lpNum} complete.`);
    }).catch(error => { res.status(500).send(`Removal of License Plate number ${lpNum} complete.`) });
});

app.get('/get-user-transactions/:acctNum', (req, res) => {
    const accountNum = req.params.acctNum;
    dbInterface.getTransactionsByField('account_num', accountNum, false).then(user => {
        res.status(200).send(user);
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

module.exports = app;

app.listen(port, () => {
    console.log(`Server is running on port ${port}...`)
});
