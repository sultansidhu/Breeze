# Breeze Parking Platform/Breeze Team

<!-- > _Note:_ This document is intended to be relatively short. Be concise and precise. Assume the reader has no prior knowledge of your application and is non-technical.  -->

## Description 
 <!-- * Provide a high-level description of your application and it's value from an end-user's perspective
 * What is the problem you're trying to solve?
 * Is there any context required to understand **why** the application solves this problem? -->
 * We are developing a web-based application that allows users to sign up for a service enabling customers to easily & seamlessly pay for parking and parking lot managers to manage parking lots; an interconnected system of cameras easily recognize the driver’s license plate number and the user is immediately charged through our app. Ultimately, this will allow the user to benefit greatly by reducing time spent in long queues as well as time spent handling payment manually. It will also benefit the owners of the parking lot as they will be able to reduce enforcement costs and manage them using our app.
 * Drivers across the GTA often face hurdles with parking - be it long queues or delay in trips due to time spent on payment. Parking lot owners often have to spend significant amounts of money on fare enforcement personnel, and still lose substantial amounts of money per year. Breeze is a startup that attempts to solve these problems. Our application is a user-centric way of allowing clients to sign up with Breeze, view their transaction history, and set up payment systems to automatically get charged therefore eliminating cash/card payment and avoid waiting in long queues, and for parking lot owners to manage their lots with greater ease.
 * It is important to understand how this web application fits into the bigger picture. Breeze Parking Technologies consists of a variety of hardware and software that are connected together - including cameras with license plate recognition technology and hardware to control the parking lot gates. Our web application allows users to leverage all of this technology and at the same time improves their experience in using/managing parking lots.

## Key Features
 <!-- * Described the key features in the application that the user can access
 * Provide a breakdown or detail for each feature that is most appropriate for your application
 * This section will be used to assess the value of the features built -->
Our web application consists of a variety of features.
* Signup - driver
Drivers have the opportunity to sign up for Breeze Parking. The sign up feature is required to enter in their relevant information so that users can benefit from Breeze Parking technology. Drivers also have the opportunity to enter in license plate numbers for their vehicles.
* Signup - Parking Lot Manager
Parking lot owners can sign up so that they too can benefit from Breeze Parking technology. The sign up feature also allows them to enter relevant information about their parking lot such as address, capacity, type, restrictions and parking lot description. Signup also allows them to set up their parking rates, including rates for specific days, rates for weekdays etc.
* Login
The login feature allows users of all types to securely login with encrypted passwords and access their dashboard, view important account information, and make changes to their account. A user with a deactivated account will be denied access to login.
* Dashboard
The dashboard serves as a dynamic page where both drivers and parking lot managers can view their transaction history in a table which is an accessible and concise format. The table contains key information, with one row per transaction, detailing the day, time-in, time-out, amount paid, and remaining balance on the account. The user is not overloaded with information, and is given the option to view their transaction history (or their parking lot history for a PLM) for the last 30 days, up to the past year. The user can also see the total transaction amount during the specified period. The dashboard page will also contain important statistics that are useful to both drivers and PLM’s, such as frequency of parking at particular times, and a distribution of the rates that are offered at various times in the day for all parking lots that the user has visited.


## Instructions
 <!-- * Clear instructions for how to use the application from the end-user's perspective
 * How do you access it? Are accounts pre-created or does a user register? Where do you start? etc. 
 * Provide clear steps for using each feature described above
 * This section is critical to testing your application and must be done carefully and thoughtfully -->
 #### Instruction:
 - As user-centric software developers, we constantly had user-friendliness and ease-of-use in mind while developing the application. The user will first visit the URL: https://breezeparking.azurewebsites.net
 - If the user already has a valid account, the user simply has to enter their email and password, and click on the "Login" button. Assuming they have entered valid credentials, they will immediately be redirected to the main dashboard page, where they may view their transaction history.
 - If the user does not have an account, they can simply click on the "Sign up" button, which will redirect them to a “lobby” page - where they can choose to sign up as a driver, sign up as a parking lot manager, or access other pages such as "Meet the Team".
 - They may sign up by first providing general information about themselves - name, email, password, etc.
 - Then, if they are a parking lot owner, they will be asked to enter details of their parking lot (name, address, capacity, any restrictions, description, etc). If they are a driver, they will be asked to enter in the details of their vehicles (license plates) as well as payment information.
 - Once the user is completes their signup, , they will be greeted with the dashboard page which will show them a variety of important information specific to them - such as transaction history (recent transactions charged on their credit cards)
 
 #### Access:
 - Our web application is deployed on Azure - Microsoft’s public cloud computing platform. As such, the user may simply visit the url provided to access the web application: https://breezeparking.azurewebsites.net
 - To use the application, a new user must first follow the application’s url, from there they can create a new account, after which they are logged in and can start using the application

 ## Development requirements
 <!-- * If a developer were to set this up on their machine or a remote server, what are the technical requirements (e.g. OS, libraries, etc.)?
 * Briefly describe instructions for setting up and running the application (think a true README). -->
* This application can be developed on all but not limited to Windows, Mac OS or Linux environment. The developer will need access to the Breeze Azure account because both the database and the web app are running and managed on Azure. The database was built using PostgreSQL, therefore the developer has to have PostgreSQL and pgAdmin installed on their machine to get admin access to manage the database server. The back-end is written in Javascript and since the back-end is a Node.js based server, Node.js and npm will be required and the dependencies of the app can be found in package.json. Front-end is written in HTML/CSS and Javascript.
* The application has been deployed and is running on Azure’s web services. For further development, the application’s development will be performed locally and that includes testing. Once a version of the app is ready for deployment, a container for the app is built locally and then pushed to Azure’s Container Registry using Docker. After the container is pushed to the server, Azure web services’ continuous deployment feature allows all the changes to be reflected instantly in the production.

 ## Deployment and Github Workflow

<!-- Describe your Git / GitHub workflow. Essentially, we want to understand how your team members shares a codebase, avoid conflicts and deploys the application.

 * Be concise, yet precise. For example, "we use pull-requests" is not a precise statement since it leaves too many open questions - Pull-requests from where to where? Who reviews the pull-requests? Who is responsible for merging them? etc.
 * If applicable, specify any naming conventions or standards you decide to adopt.
 * Describe your overall deployment process from writing code to viewing a live applicatioon
 * What deployment tool(s) are you using and how
 * Don't forget to **briefly explain why** you chose this workflow or particular aspects of it! -->
 * While developing the application, we made consistent use of branches while implementing different features, for both the frontend and backend of the application. We had several branches and typically had a weekly meeting, towards the end of which we all sat down together and merged the branches. Similarly, we had small, quick meetings between two or more members to resolve any type of code or merge conflicts. We typically divided the work between different members of the team and agreed to use different branches, so as to prevent/minimize code conflicts.
* Since JavaScript is the language of choice for front-end and back-end, we agreed on using JavaScript’s naming convention, camelCase, on every variable, method and function. Also because of the asynchronous nature of a web server, we have decided to use JavaScript’s Promises to handle asynchronous operations instead of callbacks or Async/Await for its readability and usability.
* Once we have a working development branch that is ready to be deployed publically, we branch off this branch and create a branch called ‘release.’ In this branch, we modify the code in a minor way to make it compatible with the container - including adding a Dockerfile, and adjusting some file paths. Then, the release branch is deployed on Microsoft Azure, and is pushed to Azure’s Container Registry and then a web service is created based on that container. Users can then view the app live.
* For deployment, Docker is used to containerize the app. The container is pushed to Azure’s Container Registry and then a web service is created based on that container. Once a web service is running on Azure, it is then deployed to production. Then, an end user can access the app just as they access any other online web application.

 ## Licenses
 <!-- Keep this section as brief as possible. You may read this [Github article](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/licensing-a-repository) for a start.

 * What type of license will you apply to your codebase?
 * What affect does it have on the development and use of your codebase?
 * Why did you or your partner make this choice? -->
* We’ve decided to apply the GNU AGPLv3 license to our code base. The GNU AGPLv3 has the condition of ‘network use is distribution’ which means that “users who interact with the software via network are given the right to receive a copy of the source code” (Source: https://choosealicense.com/licenses/). Our team members chose this license because GNU AGPLv3 is open-source and has the sufficient conditions for more dev opportunities.This allows for more comprehensive critique from the dev community, increases the amount of knowledge that can be gained while working on this project, puts a focus on deeper testing, better code design and better software structure. With this license, improvement and innovation can take place while the conditions placed on such a license allow a company like Breeze to use it for commercial purposes with minimum hassle.

