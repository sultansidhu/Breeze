# BREEZE PARKING TECHNOLOGIES
> _Note:_ This document is meant to evolve throughout the planning phase of your project.   That is, it makes sense for you commit regularly to this file while working on the project (especially edits/additions/deletions to the _Highlights_ section). Most importantly, it is a reflection of all the planning you work you've done in the first iteration. 
 > **This document will serve as a master plan between your team, your partner and your TA.**

## Product Details
 
#### Q1: What are you planning to build?

 > Short (1 - 2 min' read)
 * Start with a single sentence, high-level description of the product.
 * Be clear - Describe the problem you are solving in simple terms.
 * Be concrete. For example:
    * What are you planning to build? Is it a website, mobile app,
   browser extension, command-line app, etc.?      
    * When describing the problem/need, give concrete examples of common use cases.
    * Assume your the reader knows nothing about the problem domain and provide the necessary context. 
 * Focus on *what* your product does, and avoid discussing *how* you're going to implement it.      
   For example: This is not the time or the place to talk about which programming language and/or framework you are planning to use.
 * **Feel free (and very much encouraged) to include useful diagrams, mock-ups and/or links**.
 
 **Q1:** We are planning to build a web application that will allow for a seamless parking experience by removing the need for tickets/tokens at the entrance of a commercial parking lot and making payments at a kiosk prior to leaving. The web application will allow vehicle owners to register a payment account that is associated with the license plate number of their vehicles and it will allow parking lot managers to make individual accounts to register their parking lot and set the fares. This means that when a vehicle owner wishes to park at a parking lot that has been registered, the web application will automatically calculate the fare based on the duration of time the vehicle has stayed in the parking lot and allow the vehicle owner to pay the fare using their registered payment account, thus automating the entire process of parking at a commercial parking lot. Both vehicle owners and parking lot managers can view activities such as in and out time, fares paid, duration of stay and transaction history - for their individual vehicles in the case of vehicle owners, and for all vehicles in the case of parking lot managers.


#### Q2: Who are your target users?

  > Short (1 - 2 min' read max)
 * Be specific (e.g. a 'a third-year university student studying Computer Science' and not 'a student')
 * **Feel free (but not obligated) to use personas.         
   You can create your personas as part of this Markdown file, or add a link to an external site (for example, [Xtensio](https://xtensio.com/user-persona/)).**
   
**Q2**: 
##### Drivers with a pre-created account
 * Regular parkers (people who park often - like their work place is nearby and they always park at the same parking lot) - university student parking
 * Already have an account with their payment details
 * May always park at one lot, or at times park in another Breeze lot
 * For these drivers, can enter and exit with automatic payment since they already have an account
##### Drivers without a pre-created account
* Sparse parkers (people who park at parking lots once in a while when needed) - game day, leisurely visit  
* Without an account, these drivers need to have a temp account created for them when they drive in, and log the money that they need to pay. Drivers pay the bill on the way out, and the temp account gets deleted immediately thereafter.
##### Parking lot owners/managers
* A big owner with multiple lots
* A small owner with one parking lot
##### Admin 
* Main overseer of everything
* The admin is usually a member of Breeze staff; admin accounts can add new parking lots to the system, remove/suspend accounts if necessary, correct fare disputes etc.
* Admin has power over both the parking lot manager and the driver accounts.

Persona 1: Andrew the university student

Andrew is a highly motivated and capable 3rd year student studying Computer Science at the University of Toronto. Being a resident of Mississauga, he commutes down to St. George (downtown) every day, and pays for parking on an hourly basis. Andrew is often late for class because he usually wastes time paying at the kiosk with coins. Often times, when Andrew is running extremely late, he forgets to pay and comes back to be met with a hefty parking ticket. Other times, the coin machine malfunctions and Andrew is forced to travel to another parking lot where he can make his payment, wasting his time.

Persona 2: Stacey the shopper 

Stacey is a young woman in her mid 20s who lives in Markham, ON. On days like Easter & Black Friday, she drives downtown in order to satisfy her shopping desires by purchasing various clothing items at low prices. On such occasions, she often has difficulty finding parking spots, and also finds the process of entering/exiting garages very time consuming due to the high number of people who visit shopping centres on such occasions.

Persona 3: Raj the parking lot owner

Raj owns a 24 hour parking lot in downtown Toronto, he employs three people to make sure all parkers have paid their fees. As a result, he has to pay high salaries, which cuts into his profit. His recent plans of purchasing a condo building have been stalled ever since Kathleen Wynne raised the minimum wage causing him increased expenses. Often times, the wages are more than the revenue made from the parking lot. Raj additionally worries about theft from his parking meters, and seeks to find a solution that makes payment and enforcement easier, and reduces costs.

Persona 4: Arjun the Breeze admin

Arjun is a Breeze admin and works directly for the company. He is responsible for managing parking owners and drivers, and as such needs to resolve fare disputes, remove rogue accounts, add/remove parking lots from the system, and help with customer support. He wants a clean, easy to use interface that allows him to do his job efficiently.

Persona 5: James the physician

James the physician is a commuter from Richmond Hill drives to work to UHN. James has to stop at the gate to tap his ID for employee parking access all the time, and it poses hygienic concerns at this health facility. James wants a solution that allows him to directly drive past the gate without having to tap a card, and would like to be identified based on his vehicle’s license plate. 


#### Q3: Why would your users choose your product? What are they using today to solve their problem/need?

> Short (1 - 2 min' read max)
 * We want you to "connect the dots" for us - Why does your product (as described in your answer to Q1) fits the needs of your users (as described in your answer to Q2)?
 * Explain the benefits of your product explicitly & clearly. For example:
    * Save users time (how much?)
    * Allow users to discover new information (which information? And, why couldn't they discover it before?)
    * Provide users with more accurate and/or informative data (what kind of data? Why is it useful to them?)
    * Does this application exist in another form? If so, how does your differ and provide value to the users?
    * How does this align with your partner's organization's values/mission/mandate?
    
#### Q3: 
Drivers choose our product for multiple reasons. Entry and exit from parking lots becomes quicker, saving drivers several minutes every day. Drivers can view a history/record of where and when they parked, which can be useful to present to employers for reimbursement or to help with budget planning. Accessing other parking lots which are compatible with Breeze becomes easier, since drivers can use the same payment methods. There is no need for users to refill parking meters, as parking payment is automated. 

Parking managers also have reasons to choose our service. Firstly, recording license plates and charging on exit means that the need for fare enforcement personnel is minimized - we don’t need to check vehicle dashboards to see if they have a parking pass. Also because of the license plate technology, parking managers do not need to buy or maintain ticket machines, which reduces costs. Parking managers also have access to parking data, which they can use to examine their profits, compare their performances at different times, and come up with innovative ways to advance their business. Additionally, being Breeze-recognized means that more drivers will choose their parking lots because of ease of payments, further improving profits.

Today, users are using highly inefficient systems, such as pay-and-display, which requires significant enforcement, as well as some parking lots using toll booths with cashiers - this labour cost reduces profits.


#### Q4: How will you build it?

> Short (1-2 min' read max)
 * What is the technology stack? Specify any and all languages, frameworks, libraries, PaaS products or tools. 
 	* Database: PostgreSQL
	* Frontend: React, JavaScript 
	* Backend: Node.js, Express.js, Passport.js, NodeMailer.js
	* Cloud: Amazon Web Services (AWS), Docker
	* Email/Text notifications: SimpleEmailService (Our partner specified that there will be only email notifications)
	* Testing: Chai, Mocha, JsMockito

 * How will you deploy the application?
 	* We will containerize the application with Docker, and deploy it on Amazon Web Services (AWS). 
 * Describe the architecture - what are the high level components or patterns you will use? Diagrams are useful here. 
 ![Architecture](https://lh5.googleusercontent.com/mCWfD1FMeUyQrkHLxdX2JEjDv-TxdcmrMPdqUHG531Whujc-tD1wHXQC3LWe_SfNIEMZofBXWWmTa0gjDPoFQCBvbX-KWlgo0rMu6qubbeDtJChYxQrfdH8UZzlcLwzSmizyLw7b)
 	* We will be using the Model-View-Controller design pattern when we build this application. Our model consists of our profile types, our data storage including our SQL database tables, and the design of backend web routes. Our view will consist of our frontend and user interface, which will mainly be done in React. Our controller will consist of functions that talk to the database.
 * Will you be using third party applications or APIs? If so, what are they?
 	* Ingenico: This will be used to process payments and transactions. The project partner mentioned Ingenico is the most likely API to be used, although this is still not fully finalized. 

 * What is your testing strategy?
 	* We plan on using testing frameworks such as Chai and Mocha to develop test cases. We will be using the CircleCI framework for CI/CD. We would also be using JSMockito for testing mock objects.


#### Q5: What are the user stories that make up the MVP?

 * At least 5 user stories concerning the main features of the application - note that this can broken down further
 * You must follow proper user story format (as taught in lecture) ```As a <user of the app>, I want to <do something in the app> in order to <accomplish some goal>```
 * If you have a partner, these must be reviewed and accepted by them
 * The user stories should be written in Github and each one must have clear acceptance criteria.
 
 User Stories:

1) As a driver, I want a convenient interface to view my parking information so that I can manage and keep track of my expenses.

Acceptance Criteria: Users can register for an account which allows them to view their transaction history

2) As an employee with parking benefits, I want to be able to retrieve my parking history and expenses for certain date ranges in order to submit them to my employer.

Acceptance Criteria: All registered users can sort their transaction and expense history by date ranges

3) As a tourist, I want to be able to access parking lots as easily as Breeze account holders without having registered an account.

Acceptance Criteria: Non-account holders can still park while having their transactions logged

4) As a parking lot manager, I want to be able to customize the parking rates of my lots in order to run my business efficiently.

Acceptance Criteria: Parking lot managers have an interface to modify their rates, per parking lot. This interface should allow managers to modify their rates starting from the next month (to prevent bait-and-switch) and should allow them to set a variety of parameters, such as a per hour rate and an overnight rate.

5) As a parking lot manager, I want a secure payment system enforced upon my customers so that I receive the money I deserve/don’t lose money.

Acceptance Criteria: Payments are integrated into the system and all payments made by customers are tracked and viewable to parking lot managers
We wanted to have a refund system that is not consumer facing, within the application. We seek to have a more human component to that aspect of the company, and we think that it would be optimal if a human resources department handled refund requests, as there are uncertainties about what our partners payment provider can support"

6) As a driver, I want to be able to set up pre-authorized payments to pay parking fares without touching my credit card so that I can save time when entering/exiting the parking lot

Acceptance Criteria: Registered users can add payment information which will automatically charge them based on entry and exit times

7) As a parking lot manager, I want to be able to see all the parking activity for my lots, to gain insights on parking behaviour

Acceptance Criteria: Parking lot managers have a dashboard which shows parking activity for their lot(s). Parking managers should be able to display data over the past 30, 60 days or a custom date range for either one parking lot, or all parking lots. Optionally they may be able to see/compute basic statistics over time such as change in revenue to further understand their parking data.

8) As a driver with more than 1 vehicle, I want to be able to create an account and register all vehicles, so that I can conveniently use any vehicle.

Acceptance Criteria: Registered users can have multiple license plates associated with their account. There exists an interface for the user to enter in new license plates, or to remove old license plates from their account. Users can only add license plates that do not already exist in the database - send an error message if the plate already exists.

In terms of removing/editing license plates, verification, and restrictions when adding/removing plates, our partner had this to say:

“Tl;dr: we don’t try to verify this for now, since the risk is relatively low and implementation cost is high. But we can lower the risk by limiting how many licence plate number one drivers can register for and include legal T&C drivers have to agree prior to registering (will be supplied by Breeze). (two(2) would be good, as we are mainly targeting non-enterprise drivers) No restriction for editing/removing registered licence plates except: max 2 plates for each account all the time.”

9) As a driver with multiple credit/debit cards, I want to be able to add multiple payment methods and be able to select a default payment method, so that I can conveniently use any payment method.

Acceptance Criteria: A driver should be able to input multiple credit/debit cards for payment. For added security, all parameters of the credit/debit card would be required when added into the account (namely, name of the card holder, expiry date, and the three-digit code at the back of the card). There would also be an autopay feature to conveniently exact payment from a user-selected default credit/debit card.

10) As a company admin, I want to be able to suspend accounts of parking lot managers or drivers if they break the rules, to maintain the integrity of my service.

Acceptance Criteria: The parking lot manager/driver should be allowed to log in but all account actions should be prohibited. A message should display that explains the reasons why the account was banned, and suggest next steps to get the account unbanned or completely deleted if the user wants. Users will no longer be allowed to enter Breeze parking lots and autopay, they could be treated like a guest user, or if the offence was serious enough, banned completely. 

11) As a company admin, I want to be able to view overall statistics or by parking lot in order to gain marketing insights and manage growth.

Acceptance Criteria: Admins have a dashboard that shows overall/individual parking activity. Can see the same stats as the parking owner, and filter by the same time ranges, but also can view stats across all Breeze parking lots.

12) As a company admin, I want to be able to add/remove new parking lots to the database so that I can expand my network of parking lots.

Acceptance Criteria: Company admin should be able to add new parking lots to the existing parking lot database, after reviewing feasibility of the parking lot. The review is done off the app, and then upon approval, the admin can add the parking lot on the app.


----

## Process Details

#### Q6: What are the roles & responsibilities on the team?

Describe the different roles on the team and the responsibilities associated with each role. 
 * Roles should reflect the structure of your team and be appropriate for your project. Not necessarily one role to one team member.

List each team member and:
 * A description of their role(s) and responsibilities including the components they'll work on and non-software related work
 * 3 technical strengths and weaknesses each (e.g. languages, frameworks, libraries, development methodologies, etc.)
 
 Strengths/Weaknesses

Jarry: ++ Front-end with HTML/CSS/JS and frameworks such as Angular, UI/UX
	-- Routing, Databases (knowledge of but no experience developing)

Nizar: ++ JS, UI/UX Design, Databases
-- React, Testing frameworks, Deployment

Vidya: ++ SQL Databases, HTML/CSS/JavaScript, UI/UX Design
	-- Deployment, Testing frameworks, React

Abhi: ++ JavaScript, Express.js, Authentication/Login, 
           -- Databases, Deployment (AWS), React

Shahzil: ++ SQL Databases, JS (Express), some experience with React 
-- Testing frameworks, UI Design, Deployment

Jun Wei: ++ Backend(Express.js, Node.js), Databases, HTML/CSS/JS
	    --  UI/UX Design, Testing frameworks, Deployment

Sultan: ++ Backend(Express.js), Testing(Mocha, Chai), JS/CSS, Databases (NoSQL)
            -- UI/UX Design, Deployment (AWS), React, HTML

Roles/Responsibilities: Tickets will be produced by all team members, based on their needs. For example, if someone was building a feature for the app, and needed some database functionality or data storage, they would create a ticket addressed at the subteam managing the database. In this way, all members would create tickets requesting functionality that they might not be very familiar with.

Tickets will be assigned within the subgroups based on availability and skills. Within the subgroup, the members would together decide who would manage that ticket. In the event of disagreement, the ticket would be assigned at random to a person who could feasibly complete it in a reasonable amount of time.

Point of contact: Vidya

Frontend

Jarry, Abhi, Vidya

Backend

Sultan, Nizar, Jun Wei, Shahzil

Database

Vidya, Shahzil, Jun Wei

Testing

Sultan, Nizar



#### Q7: What operational events will you have as a team?

Describe meetings (and other events) you are planning to have. 
 * When and where? Recurring or ad hoc? In-person or online?
	 * We plan to have biweekly in person team meetings and weekly online team meetings through our Slack channel. We will use a service called “When2Meet” in order to determine when people are available each week. We have also confirmed this meeting frequency with our partner.
	* The in person team meetings will take place in group study rooms on campus
	* The partner meetings will be in person, biweekly, and on campus (in a group study/conference room)

 * What's the purpose of each meeting?
 	* The purpose of each team meeting is to discuss and recap progress since last meeting, set tasks and update the schedule/timeline of the project as necessary, and discuss any issues relating to the completion of the project or the team’s development process
	* Purpose of the partner meetings are to ensure that the team is on track to fulfill the requirements that the partner has set out for the project, and to get feedback on the implementation of the required features

 * Other events could be coding sessions, code reviews, quick weekly sync meeting online, etc.
 * You must have at least 2 meetings with your project partner (if you have one). Describe them here:
   * What did you discuss during the meetings?
   	* We discussed the goal and purpose of the project, types of users, technologies and APIs to consider using, required features for the MVP, additional features to add to the app, and what existing technology Breeze uses (or is developing).

   * What were the outcomes of each meeting?
   	* Gained a better understanding of the requirements of the project and what is expected of the team.

   * You must provide meeting minutes.
   	* https://docs.google.com/document/d/1CH7lpJwxPyPCwPGyoJXFIbDIrZF5DqKtltV4lB5-qEo/edit
   * You must have a regular meeting schedule established by the second meeting.  
  
#### Q8: What artifacts will you use to self-organize?

List/describe the artifacts you will produce in order to organize your team.       

 * Artifacts can be To-Do lists, Task boards, schedule(s), meeting minutes, etc.
 * We want to understand:
   * How do you keep track of what needs to get done?
   * How do you prioritize tasks?
   * How do tasks get assigned to team members?
   * How do you determine the status of work from inception to completion?
#### Q8:
We will be using Trello as a virtual to-do list in order to keep track of what needs to be done. We’ll have a To-Do list for each aspect of the stack (Database, Frontend, Backend) and a Doing and Done list. Each list will contain cards that pertain to each individual task. Trello has a built-in color-based labelling system (red = high priority, yellow = medium priority, and green = low priority) which we will be using to prioritize our tasks. Tasks will be assigned to members of the team using the “Add to Card - Members” feature that Trello has. Tasks in the Doing list are in progress and tasks in the Done list have been completed. If a task in the Doing list has stayed there for a week, members will check up on the persons in charge and provide assistance as needed. If a high priority task has been in a To-Do list for a week, a person from the respective team is randomly assigned to it and assistance is provided from other members of the team as needed.
A sample screenshot of how the board would look:
![Trello board](https://lh3.googleusercontent.com/Kq07XMho0B-V2l-7DcF0Rt_kPBZmeFmUHWZEWZPVAeHaqGeyl302cnJ-soJIZJSQt28MsSp8eCH_QbXGdbS2EB07JS4Nu_ZIxG_7ro_AEOYR7_ZMy627SEvLaAZ0rCq_MLfCBea1)


#### Q9: What are the rules regarding how your team works?

Describe your team's working culture.

Work culture:
The team tracks prioritizing work through a difficulty vs time-required-to-implement graph. We plot out all the requirements of the project on there, starting from a top level, going into increasing detail, and start tackling things from the corner with the hardest and least time consuming tasks. That way, the team would be able to efficiently manage workload, getting the most done in the least amount of time. The team would also engage in regular rounds of scrum poker, whereby each team member would rank an assigned task’s difficulty and justify the rating. This would lead to increased insight into what success looks like for that task, and how much can be accomplished within the stipulated time.

**Communications:**
 * What is the expected frequency? What methods/channels are appropriate? 
 * If you have a partner project, what is your process (in detail) for communicating with your partner?
 
Communications:
Our team will be using Slack for communications. By using when2meet.com we have identified Tuesday and Sunday as the two days where we can possibly meet every week. Meetings are scheduled on these days with an advanced notice and meeting rooms are booked in beforehand. Those who can not attend physically join the meeting remotely. 
Our partner is also in our Slack channel and we have been using that to communicate with them. Their availability for meeting aligns with ours which means we do not expect any friction in scheduling future meetings.
 
**Meetings:**
 * How are people held accountable for attending meetings, completing action items? Is there a moderator or process?
 
 Meetings:
All group members are asked to attend the meeting remotely if they can not make it in-person. The two different time slots (Tuesday and Sunday) are to ensure that people do not get excluded and everyone can show up to at least one weekly meeting.
Conflict Resolution:
We have been using polling to decide on any decisions that are contested. The suggestion with the most votes is always adopted. 
Moreover, to ensure everyone participates we will be looking at everyone’s contribution during our weekly meetings
 
**Conflict Resolution:**
 * List at least three team scenarios/conflicts you discussed in lecture and how you decided you will resolve them. Indecisions? Non-responsive team members? Any other scenarios you can think of?

Non-responsive teammates

If it is the case that there are non responsive teammates, we may begin with private-messaging the teammates who are not responsive in order to determine if there are specific circumstances which are preventing them from participating. We expect that each team member does their part, and so if there are issues with work being completed, we may need to address the issue during the 301 tutorial with our TA in attendance.


Indecision on what path to take

We have already encountered this issue several times. The method that we will use to solve this in the future will be to discuss the issue after doing individual research, making sure that everyone has a chance to have their say in the matter, and then take a vote, considering each teammate equally. For specific issues where not all team members have expertise (such as a front-end design), we will internally take decisions between the members with knowledge of the problem if it is the case that picking either choice would at most minimally impact the rest of the team members. If a particular decision would affect the whole team, we would take the whole team’s opinion.

A teammate that tries to do everything solo

At first, we would try to talk to the teammate through text messaging, inquiring on the reasoning behind such behaviour, and convincing him/her of the importance of teamwork. If that doesn’t work, we would discuss responsibilities and roles, with respect to the development and the operations of the group. Setting limits on where the person can and can’t contribute would also be a good method. Finally, if that does not work, we would approach the teaching assistant staff about the team member, and assure a path that leads to the team successfully completing the given task, without a team member compromising the progress of the team. 





----
### Highlights

Specify 3 - 5 key decisions and/or insights that came up during your meetings
and/or collaborative process.

 * Short (5 min' read max)
 * Decisions can be related to the product and/or the team process.
    * Mention which alternatives you were considering.
    * Present the arguments for each alternative.
    * Explain why the option you decided on makes the most sense for your team/product/users.
 * Essentially, we want to understand how (and why) you ended up with your current product and process plan.
 * This section is useful for important information regarding your decision making process that may not necessarily fit in other sections. 

Highlights:

One major decision that required a lot of input from the team was the type of database to use for our web application. Based on a brief discussion, we had initially chosen to use MongoDB, for several reasons. Firstly, most of us had some experience with MongoDB, and therefore we thought that using MongoDB would be easier to work with, and require less of a learning curve. We would then be able to put more time into actually developing the app. The understanding was that due to the vertical nature of our development, most of us would have to interact with the database to some extent, even though there would be more work done on the database by a few team members.
However, during the previous lecture, Professor Jorjani addressed this problem by explaining the differences between SQL and NoSQL databases. In particular, he talked about the fact that NoSQL databases could be more buggy and problematic to work with because they are less strict based on the fact that they are not as structured. In contrast, SQL databases are more structured. Prof. Jorjani also mentioned that in SQL, it is possible to make more complex queries than in NoSQL databases. We thought that we might have to make complicated search queries to our database, because we allow the user to view data about their parking lots under various filters, and this could result in several differing queries. We hence thought that we should use a SQL database instead. We also noted that the “Data Access Object” design pattern would make it possible for most of the team to not have to interact directly with the database, and instead the database designers could make interfaces with convenient functions for the rest of the app. These factors contributed to our decision to choose SQL.

Another major issue that came up during our discussions was the possibility of people registering license plates that didn’t belong to them. In that case, people would have the license plates of other cars in their accounts, and when the actual owners of the license plates came to register, they would be unable to register the license plates of their own cars! This seemed to be a pretty big issue, and we were unsure of how to verify that the plate numbers, given that we would probably need the owner to upload documents proving that it was his plate. This would take away from the convenience of the app.
Eventually, we asked our partner for some suggestions. He said that due to the risk of misuse being quite low, implementation costs being quite high, and the limit of two plates per account, we didn’t need to account for this case in our app. It was suggested that in the future there would be certified employees at Breeze who would manually verify such cases, so we wouldn’t need to account for this issue in our app.

Another point of contention within the team was the method of communication with the user of the app - a driver that uses the application for parking. There were two methods proposed for it, one being through text and the other being through email. Since well established libraries exist within Node to help with the sending of emails, and since the owner of Breeze has specified the need for such, we will be using email notifications for the users of this application. 
