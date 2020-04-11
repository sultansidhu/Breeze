"A test suite for the backend."
process.env.NODE_ENV = 'test';
const chai = require('chai');
const chaiHTTP = require('chai-http');
const server = require('../backend/server');
const db = require('../backend/db_interface');
const setCookie = require('set-cookie-parser');
const fs = require('fs');
const should = chai.should();

chai.use(chaiHTTP);

const getNum = () => {
    return parseInt(fs.readFileSync("num.txt", {encoding:"utf8"}));
};

const saveNum = (parsedInt) => {
    fs.writeFile("num.txt", (parsedInt+1).toString(), (err) => {
        if (err) console.log(err);
    });
};

let numTest;

describe('Name', ()=>{
    before((done) => {
        console.log("Testing beginning...");
        numTest = getNum();
        done();
    });
    after((done) => {
        console.log("Testing complete...");
        saveNum(numTest);
        done();
    });
    // authentication tests
    describe('/POST authenticate', () => {
        it('it should be able to log an already existing user in', (done) => {
            chai.request(server)
            .post('/authenticate')
            .send(
                {
                    'user':{
                        'email': 'user1@gmail.com',
                        'password': 'password123'
                    }
                }
            )
            .end((err, res) => {
                res.should.have.status(200);
                res.body.accountType.should.be.eql("plm");
                done();
            });
        });
    });
    describe('/POST authenticate', () => {
        it('it should give a 401 error, when trying logins with a non-existing user', (done) => {
            chai.request(server)
            .post('/authenticate')
            .send({
                'user':{
                    'email': 'somethingnew@gmail.com',
                    'password': 'somethingelse'
                }
            })
            .end((err, res) => {
                res.should.have.status(401);
                res.body.error.should.be.eql("Email is not registered! Kindly sign up!");
                done();
            });
        });
    });
    describe('/POST authenticate' ,() => {
        it('it should return an error when the supplied password is incorrect', (done) => {
            chai.request(server)
            .post('/authenticate')
            .send({
                'user':{
                    'email': 'user1@gmail.com', 
                    'password': 'somethingwrong'
                }
            })
            .end((err, res) => {
                res.should.have.status(403);
                res.body.error.should.be.eql("Incorrect password! Please try again!");
                done();
            })
        });
    });
    describe('/GET get-cookie', () => {
        it('it should give the account number, email and the account type of the signed-in person',(done) => {
            const agent = chai.request.agent(server);
            agent.post('/authenticate')
            .send({'user':{'email': 'user1@gmail.com','password':'password123'}})
            .then(res => {
                res.should.have.cookie('userData');
                const cookie = JSON.parse(setCookie.parse(res, {decodeValues: true, map: true}).userData.value.substring(2)); 
                should.equal(cookie.email, 'user1@gmail.com');
                should.equal(cookie.accountNum, 100013);
                should.equal(cookie.acctType, 'plm');
                done();
            })
            .catch(err => {
                console.log(err);
                done();
            })
        });
    });
    describe('/GET get-cookie', () => {
        it('it should give an error when the person loggin in is not registered',(done) => {
            const agent = chai.request.agent(server);
            agent.post('/authenticate')
            .send({'user':{'email': 'usernew6969@gmail.com','password':'password123'}})
            .then(res => {
                res.should.have.status(401);
                res.should.not.have.cookie('userData');
                done();
            })
            .catch(err => {
                console.log(err);
                done();
            })
        });
    });
    describe('/GET get-cookie', () => {
        it('it should give an error when the person logging in has the wrong password',(done) => {
            const agent = chai.request.agent(server);
            agent.post('/authenticate')
            .send({'user':{'email': 'user1@gmail.com','password':'password6969'}})
            .then(res => {
                res.should.have.status(403);
                res.should.not.have.cookie('userData');
                done();
            })
            .catch(err => {
                console.log(err);
                done();
            })
        });
    });
    describe('/GET get-cookie', () => {
        it('it should give an error when the person logging in has a deactivated account',(done) => {
            const agent = chai.request.agent(server);
            agent.post('/authenticate')
            .send({'user':{'email': 'brz@subaru.ca','password':'password123'}})
            .then(res => {
                res.should.have.status(400);
                res.should.not.have.cookie('userData');
                done();
            })
            .catch(err => {
                console.log(err);
                done();
            })
        });
    });
    describe('/GET logout', () => {
        it('it should successfully log out the user.', (done) => {
            chai.request(server)
            .get('/logout')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });
    describe('/GET get-cookie', () => {
        it('it should give a destroyed cookie once the person has signed out',(done) => {
            const agent = chai.request.agent(server);
            agent.post('/authenticate')
            .send({'user':{'email': 'user1@gmail.com','password':'password123'}})
            .then(res => {
                res.should.have.status(200);
                res.should.have.cookie('userData');
                return agent.get('/logout');
            })
            .then(res => {
                res.should.have.status(200);
                res.should.not.have.cookie('userData');
                done();
            })
            .catch(err => {console.log(err); done();});
        });
    });
    // new user signup tests
    describe('/POST new-user', () => {
        it('it should return error if the person signing up already exists', (done) => {
            const agent = chai.request.agent(server);
            agent.post('/new-user')
            .send({
                'newUser':{
                    'email': 'usertest6@gmail.com',
                    'password': 'password123', 
                    'firstName':'Hihi', 
                    'lastName': 'YeeHaw', 
                    'phoneNum': '4169999999', 
                    'accountType': 'plm'
                }
            })
            .then(res => {
                res.should.have.status(403);
                res.should.not.have.cookie('userData');
                done();
            })
            .catch(err => {console.log(err); done();});
        });
    });
    describe('/POST new-user', () => {
        it('it should give an error when person signing up has a phone number already registered', (done) => {
            const agent = chai.request.agent(server);
            agent.post('/new-user')
            .send({
                "newUser":{
                    "email": "somethingnewlalala@gmail.com",
                    "password": "password123", 
                    "firstName":"Hihi", 
                    "lastName": "YeeHaw", 
                    "phoneNum": "4160000000", 
                    "accountType": "plm"
                }
            })
            .then(res => {
                res.should.have.status(403);
                res.should.not.have.cookie('userData');
                done();
            })
            .catch(err => {console.log(err);done();});
        });
    });
    describe('/POST new-user', () => {
        it('it should work well with a new person signing up', (done) => {
            const agent = chai.request.agent(server);
            agent.post('/new-user')
            .send({
                "newUser":{
                    "email": "newusertest00"+numTest.toString()+"@gmail.com",
                    "password": "password123", 
                    "firstName":"Hihi", 
                    "lastName": "YeeHaw", 
                    "phoneNum": "416000"+numTest.toString(), 
                    "accountType": "plm"
                }
            })
            .then(res => {
                res.should.have.status(200);
                res.should.have.cookie('userData');
                const cookie = JSON.parse(setCookie.parse(res, {decodeValues: true, map: true}).userData.value.substring(2)); 
                should.equal(res.body.value.accountNum, cookie.accountNum);
                should.equal("newusertest00"+numTest.toString()+"@gmail.com", cookie.email);
                should.equal("plm", cookie.acctType);
                done();
            })
            .catch(err => {console.log(err);done();});
        });
    });
    describe('/GET search-acct-num', () => {
        it('it should return a single user when searching by account numbers on an existing user', (done) => {
            chai.request(server)
            .get('/search-acct-num/100013')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.eql({
                    "first_name": "userFirstName",
                    "last_name": "userLastName",
                    "phone_num": "6471234567",
                    "email": "user1@gmail.com",
                    "account_num": 100013,
                    "type": "plm",
                    "active": true
                });
                done();
            });
        });
    });
    describe('/GET search-acct-num', () => {
        it('it should return empty object when searching by account number for non-existent user', (done) => {
            chai.request(server)
            .get('/search-acct-num/198765')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });
    describe('/GET search-phone-num', () => {
        it('it should return a single user when searching by phone numbers on an existing user', (done) => {
            chai.request(server)
            .get('/search-phone-num/6471234567')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.eql({
                    "first_name": "userFirstName",
                    "last_name": "userLastName",
                    "phone_num": "6471234567",
                    "email": "user1@gmail.com",
                    "account_num": 100013,
                    "type": "plm",
                    "active": true
                });
                done();
            });
        });
    });
    describe('/GET search-phone-num', () => {
        it('it should return empty object when searching by phone number for non-existent user', (done) => {
            chai.request(server)
            .get('/search-phone-num/6481234567')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
        });
    });
    describe('/GET search-email', () => {
        it('it should return a single user when searching by email address on an existing user', (done) => {
            chai.request(server)
            .get('/search-email/user1@gmail.com')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.eql({
                    "first_name": "userFirstName",
                    "last_name": "userLastName",
                    "phone_num": "6471234567",
                    "email": "user1@gmail.com",
                    "account_num": 100013,
                    "type": "plm",
                    "active": true
                });
                done();
            });
        });
    });
    describe('/GET search-email', () => {
        it('it should return empty object when searching by email address for non-existent user', (done) => {
            chai.request(server)
            .get('/search-email/usernewhaha1@gmail.com')
            .end((err, res) => {
                res.should.have.status(500);
                done();
            });
        });
    });
});