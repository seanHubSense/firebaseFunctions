const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors')({ origin: true });
// const uploadString = require('firebase-storage');
const functions = require("firebase-functions");
const crypto = require('crypto');
const { Stream } = require('stream');


// catholic sense
const firebaseConfig = {
    apiKey: "AIzaSyASjZVnv-mMwIyX2k4c0q1lNv2I1X8xZFg",
    authDomain: "catholicsense-f8d60.firebaseapp.com",
    databaseURL: "https://catholicsense-f8d60.firebaseio.com",
    projectId: "catholicsense-f8d60",
    storageBucket: "catholicsense-f8d60.appspot.com",
    messagingSenderId: "9478473522",
    appId: "1:9478473522:web:2d3f55c51edd0c75bfb92b",
    measurementId: "G-FFQ7EH7DZE"
};

// sense social
// const firebaseConfig = {
//     apiKey: "AIzaSyDHDVhLcShVWKXra5JfEJqkl5YNDR1DeU4",
//     authDomain: "sense-social.firebaseapp.com",
//     databaseURL: "https://sense-social.firebaseio.com",
//     projectId: "sense-social",
//     storageBucket: "sense-social.appspot.com",
//     messagingSenderId: "936426746276",
//     appId: "1:936426746276:web:5fbd44dc0be0f9ca509131",
//     measurementId: "G-DRFYEMC1RJ"
// };
// cred_obj = admin.credential.cert()
admin.initializeApp(firebaseConfig)




exports.presentFeatured = (functions, admin) => functions.pubsub.schedule('10 1 * * *')
    .timeZone('Europe/London')
    .onRun(async (req, res) => {


        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events")
        const userRef = dbRef.child("users")
        const eventWeeklyRef = dbRef.child("eventweekly")
        const companyRef = dbRef.child("companies")
        const exposedEventsRef = dbRef.child("eventsexposed")

        exposedEventsRef.remove()

        const eventsSnapshot = await eventRef.get()
        const eventWeeklySnapshot = await eventWeeklyRef.get()
        const usersSnapshot = await userRef.get()
        const companySnapshot = await companyRef.get()

        const activeAdEventIDs = []
        companySnapshot.forEach(function (childSnapshot) {
            var childData = childSnapshot.val();
            if (childData.activeAdEventIDs) {
                activeAdEventIDs.push(...childData.activeAdEventIDs)
            }
        })

        const relevantEvents = []
        const relevantEventsTest = []
        const usersForEvents = []


        eventsSnapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;
            if (activeAdEventIDs.includes(key) && new Date(childSnapshot.val()["eventStartDate"]) >= new Date()) {
                const newItem = childSnapshot.val()
                newItem["id"] = key
                relevantEvents.push(Object.assign({}, newItem))
                relevantEventsTest.push(childSnapshot.val())
            }
        })
        eventWeeklySnapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;
            if (activeAdEventIDs.includes(key) && new Date(childSnapshot.val()["eventEndDate"]) >= new Date()) {
                const newItem = childSnapshot.val()
                newItem["id"] = key
                relevantEvents.push(Object.assign({}, newItem))
                relevantEventsTest.push(childSnapshot.val())
            }
        })
        // console.log("event Featured List")
        relevantEvents.forEach(eventItem => {
            const userItem = usersSnapshot.child(eventItem.organiser)
            usersForEvents.push(userItem.val()["name"])
            if (userItem.val()["name"]) {
                eventItem["organiserName"] = userItem.val()["name"]
                eventItem["organiserUsername"] = userItem.val()["username"]
                eventItem["organiserImage"] = userItem.val()["image"] ? userItem.val()["image"] : null
                // exposedEventsRef.push(eventItem)
                const specificEventRef = exposedEventsRef.child(eventItem["id"])
                specificEventRef.set(eventItem)
                // exposedEventsRef.push(eventItem["id"]=eventItem)
            }
        });

        if (relevantEvents) {
            res.json({ result: relevantEvents, featuredIDs: activeAdEventIDs, user: usersForEvents });
        } else {
            res.json({ result: `function failed, why?:` + relevantEvents });
        }



    });
;

exports.getWebHomepage = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const categories = ["Arts & Entertainment", "Catechesis", "Charity & Causes", "Conference", "Evangelisation", "Games", "Holy Mass", "Family & Education", "Festivals", "Film & Theatre", "Food & Drinks", "Formation", "Literature", "NFP", "Music", "Party", "Politics & Debate", "Prayer Groups", "Retreat", "Sacraments", "Spiritual Development", "Sports", "Tour", "Travel & Outdoors", "Vigils", "Other", "Pilgrimage",];

        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events")
        const userRef = dbRef.child("users")
        const eventWeeklyRef = dbRef.child("eventweekly")
        const exposedEventsRef = dbRef.child("eventsexposed")

        const eventsSnapshot = await eventRef.get()
        const eventWeeklySnapshot = await eventWeeklyRef.get()
        const usersSnapshot = await userRef.get()
        const featuredEventsSnapshot = await exposedEventsRef.get()
        const categoryNames = categories;
        const today = new Date()
        const datePlusMonth = new Date()
        datePlusMonth.setMonth(datePlusMonth.getMonth() + 2)

        const featuredEvents = []
        const popularTags = []
        const relevantEvents = []

        featuredEventsSnapshot.forEach(function (childSnapshot) {
            if (new Date(childSnapshot.val()["eventStartDate"]) >= today) {
                var key = childSnapshot.key;
                const newItem = childSnapshot.val()
                newItem["id"] = key
                featuredEvents.push(Object.assign({}, newItem))
            }
        })

        const categoryList = {}
        eventsSnapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;

            if (!categoryList[childSnapshot.val()["category"]]) { categoryList[childSnapshot.val()["category"]] = 1 }
            else { categoryList[childSnapshot.val()["category"]] = categoryList[childSnapshot.val()["category"]] + 1 }

            //relavent events = ones that are that are soon
            if (new Date(childSnapshot.val()["eventStartDate"]) >= today &&
                new Date(childSnapshot.val()["eventStartDate"]) < datePlusMonth &&
                childSnapshot.val()["open"] === true &&
                childSnapshot.val()["draft"] === false &&
                childSnapshot.val()["deleted"] === false) {

                const newItem = childSnapshot.val()
                newItem["id"] = key
                relevantEvents.push(Object.assign({}, newItem))
            }
        })
        eventWeeklySnapshot.forEach(function (childSnapshot) {

            const startDate = getNextVaildDate(childSnapshot.val()["activeEventDates"])
            if (!categoryList[childSnapshot.val()["category"]]) { categoryList[childSnapshot.val()["category"]] = 1 }
            else { categoryList[childSnapshot.val()["category"]] = categoryList[childSnapshot.val()["category"]] + 1 }
            //relavent events = ones that are that are soon
            var key = childSnapshot.key;
            if (
                (
                    new Date(childSnapshot.val()["eventEndDate"]) >= today ||
                    new Date(startDate) < datePlusMonth
                ) &&
                childSnapshot.val()["open"] === true &&
                childSnapshot.val()["draft"] === false &&
                childSnapshot.val()["deleted"] === false) {

                const newItem = childSnapshot.val()
                newItem["id"] = key
                newItem["eventStartDate"] = startDate
                relevantEvents.push(Object.assign({}, newItem))
            }
        })
        //add user information to events
        relevantEvents.forEach(eventItem => {
            const userItem = usersSnapshot.child(eventItem.organiser)
            if (userItem.val()["name"]) {
                eventItem["organiserName"] = userItem.val()["name"]
                eventItem["organiserUsername"] = userItem.val()["username"]
                eventItem["organiserImage"] = userItem.val()["image"] ? userItem.val()["image"] : null
                if (eventItem["hideFullLocation"] === true) {
                    eventItem["fullLocation"] = "NONE"
                    eventItem["longlat"] = ["NONE", "NONE"]
                }
                eventItem["notificationID"] = "NONE"
            }
        });

        for (var cate in categoryList) {
            popularTags.push([categoryList[cate], cate, categoryNames[cate - 1]]);
        }
        popularTags.sort(function (a, b) {
            return b[0] - a[0];
        });

        relevantEvents.sort(function (o1, o2) {
            if (o1["eventStartDate"] < o2["eventStartDate"]) return -1;
            else if (o1["eventStartDate"] > o2["eventStartDate"]) return 1;
            else return 0;
        });

        if (relevantEvents) {
            res.json({ result: 200, featured: featuredEvents, events: relevantEvents, popularTags: popularTags.slice(0, 16) });
        } else {
            res.json({ result: 501, message: `function failed, why?:` + relevantEvents });
        }

    })
});

exports.getWebSearch = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events")
        const userRef = dbRef.child("users")
        const eventWeeklyRef = dbRef.child("eventweekly")

        const eventsSnapshot = await eventRef.get()
        const eventWeeklySnapshot = await eventWeeklyRef.get()
        const usersSnapshot = await userRef.get()
        const today = new Date()
        const preNextFourMonths = new Date()
        const nextFourMonths = preNextFourMonths.setMonth(today.getMonth() + 4)

        const paramIndex = req.query.index ? req.query.index : 0;
        const paramSearch = req.query.searchterm ? req.query.searchterm.toLowerCase() : "";
        const paramLocation = req.query.searchlocation ? req.query.searchlocation.toLowerCase() : "";
        const paramStartDate = req.query.startdate ? new Date(req.query.startdate) : today;
        const paramEndDate = req.query.enddate ? new Date(req.query.enddate) : nextFourMonths;

        const relevantEvents = []


        eventsSnapshot.forEach(function (childSnapshot) {
            try {
                var key = childSnapshot.key;
                const hashtagsText = childSnapshot.val()["hashtags"] ? childSnapshot.val()["hashtags"] : ["other"]
                const searchText = hashtagsText.join().toLowerCase() + " " + childSnapshot.val()["eventName"].toLowerCase()
                const locationText = childSnapshot.val()["fullLocation"] ? childSnapshot.val()["fullLocation"].toLowerCase() : "unknown"
                //relavent events = ones that are that are soon
                if (
                    new Date(childSnapshot.val()["eventStartDate"]) >= paramStartDate &&
                    new Date(childSnapshot.val()["eventStartDate"]) <= paramEndDate &&
                    (
                        paramSearch == "" ||
                        searchText.includes(paramSearch)
                    ) &&
                    (
                        paramLocation == "" ||
                        locationText.includes(paramLocation)
                    ) &&
                    childSnapshot.val()["open"] === true &&
                    childSnapshot.val()["draft"] === false &&
                    childSnapshot.val()["deleted"] === false) {

                    const newItem = childSnapshot.val()
                    newItem["id"] = key
                    relevantEvents.push(Object.assign({}, newItem))
                }
            } catch (error) {

            }
        })
        eventWeeklySnapshot.forEach(function (childSnapshot) {
            try {
                const startDate = getNextVaildDate(childSnapshot.val()["activeEventDates"])
                const hashtagsText = childSnapshot.val()["hashtags"] ? childSnapshot.val()["hashtags"] : ["other"]
                const searchText = hashtagsText.join().toLowerCase() + " " + childSnapshot.val()["eventName"].toLowerCase()
                const locationText = childSnapshot.val()["fullLocation"] ? childSnapshot.val()["fullLocation"].toLowerCase() : "unknown"
                //relavent events = ones that are that are soon
                var key = childSnapshot.key;
                if (
                    (
                        new Date(childSnapshot.val()["eventEndDate"]) >= paramStartDate && new Date(childSnapshot.val()["eventEndDate"]) <= paramEndDate ||
                        new Date(startDate) <= paramEndDate && new Date(startDate) >= paramStartDate
                    ) &&
                    (
                        paramSearch == "" ||
                        searchText.includes(paramSearch)
                    ) &&
                    (
                        paramLocation == "" ||
                        locationText.includes(paramLocation)
                    ) &&
                    childSnapshot.val()["open"] === true &&
                    childSnapshot.val()["draft"] === false &&
                    childSnapshot.val()["deleted"] === false) {

                    const newItem = childSnapshot.val()
                    newItem["id"] = key
                    newItem["eventStartDate"] = startDate
                    relevantEvents.push(Object.assign({}, newItem))
                }
            } catch (error) {

            }
        })
        //add user information to events
        relevantEvents.forEach(eventItem => {
            const userItem = usersSnapshot.child(eventItem.organiser)
            if (userItem.val()["name"]) {
                eventItem["organiserName"] = userItem.val()["name"]
                eventItem["organiserUsername"] = userItem.val()["username"]
                eventItem["organiserImage"] = userItem.val()["image"] ? userItem.val()["image"] : null
                if (eventItem["hideFullLocation"] === true) {
                    eventItem["fullLocation"] = "NONE"
                    eventItem["longlat"] = ["NONE", "NONE"]
                }
                eventItem["notificationID"] = "NONE"
            }
        });

        relevantEvents.sort(function (o1, o2) {
            if (o1["eventStartDate"] < o2["eventStartDate"]) return -1;
            else if (o1["eventStartDate"] > o2["eventStartDate"]) return 1;
            else return 0;
        });

        if (relevantEvents) {
            res.json({ result: 200, events: relevantEvents.slice(Number(paramIndex), Number(paramIndex) + 32), more: relevantEvents[Number(paramIndex) + 33] !== undefined });
        } else {
            res.json({ result: 501, message: `function failed, why?:` + relevantEvents });
        }
    })
});


exports.getEventPage = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramEventID = req.query.eventid
        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events")
        const userRef = dbRef.child("users")
        const eventWeeklyRef = dbRef.child("eventweekly")

        const eventsSnapshot = await eventRef.get()
        const eventWeeklySnapshot = await eventWeeklyRef.get()
        const usersSnapshot = await userRef.get()

        const eventsObjSnapshot = eventsSnapshot.child(paramEventID)
        const eventsWeeklyObjSnapshot = eventWeeklySnapshot.child(paramEventID)
        const acutalObjSnapshot = eventsObjSnapshot.val() !== null ? eventsObjSnapshot : eventsWeeklyObjSnapshot

        const today = new Date()

        const eventID = acutalObjSnapshot.key
        const eventCategory = acutalObjSnapshot.val()["category"]
        const eventLocationArray = acutalObjSnapshot.val()["fullLocation"].split(",")

        const targetEventItem = Object.assign({}, acutalObjSnapshot.val())
        const targetUserItem = usersSnapshot.child(acutalObjSnapshot.val()["organiser"])
        if (targetUserItem.val()["name"]) {
            targetEventItem["id"] = eventID
            targetEventItem["organiserName"] = targetUserItem.val()["name"]
            targetEventItem["organiserUsername"] = targetUserItem.val()["username"]
            targetEventItem["organiserImage"] = targetUserItem.val()["image"] ? targetUserItem.val()["image"] : null
        }

        const similarEventsArray = [[], [], [], [], [], [], [], [], [], [], []];


        eventsSnapshot.forEach((childSnapshot) => {
            if (similarEventsArray.flat(1).length > 8) {
                return
            }
            try {


                var key = childSnapshot.key;

                //relavent events = ones that are that are soon
                if (
                    new Date(childSnapshot.val()["eventStartDate"]) >= today &&
                    childSnapshot.val()["open"] === true &&
                    childSnapshot.val()["draft"] === false &&
                    childSnapshot.val()["deleted"] === false &&
                    key !== eventID) {
                    const newItem = childSnapshot.val()
                    newItem["id"] = key
                    if (eventCategory === childSnapshot.val()["category"]) {
                        if (eventLocationArray.length > 0 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[0])) {
                            similarEventsArray[0].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 1 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[1])) {
                            similarEventsArray[1].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 2 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[2])) {
                            similarEventsArray[2].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 3 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[3])) {
                            similarEventsArray[3].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 4 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[4])) {
                            similarEventsArray[4].push(Object.assign({}, newItem))
                        } else {
                            similarEventsArray[10].push(Object.assign({}, newItem))
                        }
                    }
                    else {
                        if (eventLocationArray.length > 0 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[0])) {
                            similarEventsArray[5].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 1 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[1])) {
                            similarEventsArray[6].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 2 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[2])) {
                            similarEventsArray[7].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 3 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[3])) {
                            similarEventsArray[8].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 4 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[4])) {
                            similarEventsArray[9].push(Object.assign({}, newItem))
                        }
                    }
                }
            } catch (error) {

            }
        })

        eventWeeklySnapshot.forEach((childSnapshot) => {
            if (similarEventsArray.flat(1).length > 16) {
                return
            }
            try {

                //relavent events = ones that are that are soon
                var key = childSnapshot.key;
                if (
                    new Date(childSnapshot.val()["eventEndDate"]) >= today &&
                    childSnapshot.val()["open"] === true &&
                    childSnapshot.val()["draft"] === false &&
                    childSnapshot.val()["deleted"] === false &&
                    key !== eventID) {

                    const newItem = childSnapshot.val()
                    newItem["id"] = key
                    newItem["eventStartDate"] = getNextVaildDate(newItem["activeEventDates"])

                    if (eventCategory === childSnapshot.val()["category"]) {
                        if (eventLocationArray.length > 0 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[0])) {
                            similarEventsArray[0].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 1 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[1])) {
                            similarEventsArray[1].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 2 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[2])) {
                            similarEventsArray[2].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 3 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[3])) {
                            similarEventsArray[3].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 4 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[4])) {
                            similarEventsArray[4].push(Object.assign({}, newItem))
                        }
                        else {
                            similarEventsArray[10].push(Object.assign({}, newItem))
                        }
                    }
                    else {
                        if (eventLocationArray.length > 0 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[0])) {
                            similarEventsArray[5].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 1 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[1])) {
                            similarEventsArray[6].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 2 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[2])) {
                            similarEventsArray[7].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 3 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[3])) {
                            similarEventsArray[8].push(Object.assign({}, newItem))
                        } else if (eventLocationArray.length > 4 && childSnapshot.val()['fullLocation'].includes(eventLocationArray[4])) {
                            similarEventsArray[9].push(Object.assign({}, newItem))
                        }
                    }
                }

            } catch (error) {

            }
        })

        const similarEvents = similarEventsArray.flat(1)
        //add user information to events
        similarEvents.forEach(eventItem => {
            const userItem = usersSnapshot.child(eventItem.organiser)
            if (userItem.val()["name"]) {
                eventItem["organiserName"] = userItem.val()["name"]
                eventItem["organiserUsername"] = userItem.val()["username"]
                eventItem["organiserImage"] = userItem.val()["image"] ? userItem.val()["image"] : null
                if (eventItem["hideFullLocation"] === true) {
                    eventItem["fullLocation"] = "NONE"
                    eventItem["longlat"] = ["NONE", "NONE"]
                }
                eventItem["notificationID"] = "NONE"
            }
        });



        if (similarEvents) {
            res.json({ result: 200, events: similarEvents.slice(0, 4), targetEvent: targetEventItem });
        } else {
            res.json({ result: 501, message: `function failed, why?:` + similarEvents });
        }
    })
});

exports.getEventOnly = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramEventID = req.query.eventid
        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events").child(paramEventID)
        const eventWeeklyRef = dbRef.child("eventweekly").child(paramEventID)

        const eventsSnapshot = await eventRef.get()
        const eventWeeklySnapshot = await eventWeeklyRef.get()

        const acutalObjSnapshot = eventsSnapshot.val() !== null ? eventsSnapshot : eventWeeklySnapshot
        const userRef = dbRef.child("users").child(acutalObjSnapshot.val()["organiser"])
        const usersSnapshot = await userRef.get()


        const targetEventItem = Object.assign({}, acutalObjSnapshot.val())
        //add user information to events
        const userItem = usersSnapshot
        if (userItem.val()["name"]) {
            targetEventItem["id"] = paramEventID
            targetEventItem["organiserName"] = userItem.val()["name"]
            targetEventItem["organiserUsername"] = userItem.val()["username"]
            targetEventItem["organiserImage"] = userItem.val()["image"] ? userItem.val()["image"] : null
            if (targetEventItem["hideFullLocation"] === true) {
                targetEventItem["fullLocation"] = "NONE"
                targetEventItem["longlat"] = ["NONE", "NONE"]
            }
            targetEventItem["notificationID"] = "NONE"
        }



        if (acutalObjSnapshot) {
            res.json({ result: 200, targetEvent: targetEventItem });
        } else {
            res.json({ result: 501, message: `function failed, why?:` + targetEventItem });
        }
    })
});

async function getUserFromNumber(dbRef, paramPhone, paramPassword) {
    const currentUserAuth = await admin.auth().getUserByPhoneNumber(paramPhone)
    const userID = "CATH-"+currentUserAuth["uid"]
    const userRef = await dbRef.child("users").child(userID).get()
    console.log(userRef.val())
   return 
}


exports.getOrganiserEvents = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramPhone = "+" + req.query.phoneNo.trim()
        const paramPassword = Number(req.query.password)
        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events")

        const currentUserAuth = await admin.auth().getUserByPhoneNumber(paramPhone)
        const userID = "CATH-"+currentUserAuth["uid"]
        const userRef = await dbRef.child("users").child(userID).get()

        const addID = (obj, id) => {
            const targetEventItem = Object.assign({}, obj)
            targetEventItem["key"] = id
            return targetEventItem
        }   

        const activeUser = userRef.val()["webPass"] === paramPassword? addID(userRef.val(), userID) : null

        const orgainisedFilter = (item) => {
            if (item["organiser"] === userID && item["deleted"] === false && item["draft"] !== true) return (item)
        }

        if (activeUser) {

            
            const organisedEventList = []
            // const eventsSnapshot = await eventRef.equalTo(userID,"organiser").get()
            const eventsSnapshot = await eventRef.get()
            eventsSnapshot.forEach(function (childSnapshot) {
                try {
                    var key = childSnapshot.key;
                    if (
                        childSnapshot.val()["organiser"] === userID &&
                        childSnapshot.val()["draft"] === false &&
                        childSnapshot.val()["deleted"] === false) {
    
                        const newItem = childSnapshot.val()
                        newItem["key"] = key
                        organisedEventList.push(Object.assign({}, newItem))
                    }
                } catch (error) {
    
                }
            })
            // const eventArray = eventsSnapshot.key()
            // console.log(eventArray)
            // const eventArray = Object.keys(eventsSnapshot.val()).map((key) => addID(eventsSnapshot.val()[key], key));

            // const organisedEventList = eventArray.filter(orgainisedFilter)
            res.json({ result: 200, organisedEvent: organisedEventList, user: activeUser });
        } else {
            res.json({ result: 401, message: `invaild user` });
        }
    })
});


exports.createEvent = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramPhone = "+" + req.query.phoneNo.trim()
        const paramPassword = Number(req.query.password)
        const dbRef = admin.database().ref();
        const paramEventBody = JSON.parse(req.body)

        const newID = admin.firestore().collection('events').doc().id;
        const eventRef = dbRef.child("events").child(newID)

        const currentUserAuth = await admin.auth().getUserByPhoneNumber(paramPhone)
        const userID = "CATH-"+currentUserAuth["uid"]
        const userRef = await dbRef.child("users").child(userID).get()

        const activeUser = userRef.val()["webPass"] === paramPassword? userRef.val() : null


        if (activeUser) {
            if (paramEventBody.image.indexOf("firebasestorage.googleapis.com") === -1) {
                const imageUrl = await uploadImage(paramEventBody.image)

                paramEventBody.image = imageUrl
            }
            const newEventItem = setEventValues({}, paramEventBody)
            eventRef.set(newEventItem)
            console.log(newEventItem)
            newEventItem.key=newID
            res.json({ result: 200, targetEvent: newEventItem });
        } else {
            res.json({ result: 501, message: `function failed, why?:` + targetEventItem });
        }
    })
});

exports.editEvent = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramPhone = "+" + req.query.phoneNo.trim()
        const paramPassword = Number(req.query.password)
        const paramEventBody = JSON.parse(req.body)
        const paramEventID = paramEventBody.key
        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events").child(paramEventID)

        const currentUserAuth = await admin.auth().getUserByPhoneNumber(paramPhone)
        const userID = "CATH-"+currentUserAuth["uid"]
        const userRef = await dbRef.child("users").child(userID).get()

        const activeUser = userRef.val()["webPass"] === paramPassword? userRef.val() : null


        if (activeUser) {
            if (paramEventBody.image.indexOf("firebasestorage.googleapis.com") === -1) {
                const imageUrl = await uploadImage(paramEventBody.image)

                paramEventBody.image = imageUrl
            }
            const newEventItem = setEventValues(eventsSnapshot.val(), paramEventBody)
            eventRef.set(newEventItem)
            newEventItem.key=paramEventID


            res.json({ result: 200, targetEvent: newEventItem, });
        } else {
            res.json({ result: 501, message: `function failed, why?:` + targetEventItem });
        }
    })
});

exports.deleteEvent = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramPhone = "+" + req.query.phoneNo.trim()
        const paramPassword = Number(req.query.password)
        const paramEventBody = JSON.parse(req.body)
        const paramEventID = paramEventBody.key
        const dbRef = admin.database().ref();
        const specificEventRef = dbRef.child("events").child(paramEventID)
        const eventSnapshot = await specificEventRef.get()
        const targetEventItem = Object.assign({}, eventSnapshot.val())
        
        const currentUserAuth = await admin.auth().getUserByPhoneNumber(paramPhone)
        const userID = "CATH-"+currentUserAuth["uid"]
        const userRef = await dbRef.child("users").child(userID).get()

        const activeUser = userRef.val()["webPass"] === paramPassword? userRef.val() : null

        if (activeUser) {
            targetEventItem["deleted"] = true;

            specificEventRef.set(targetEventItem)

            res.json({ result: 200, key: paramEventID });
        } else {
            res.json({ result: 501, message: `function failed, why` });
        }
    })
});

exports.deleteOldEvents = functions.pubsub.schedule('0 1 * * *')
    .timeZone('Europe/London')
    .onRun(async (req, res) => {

        const dbRef = admin.database().ref();
        const userEventRef = dbRef.child("userevents")
        const chatRef = dbRef.child("communication")
        const eventRef = dbRef.child("events")
        const eventWeeklyRef = dbRef.child("eventweekly")

        const eventsSnapshot = await eventRef.get()
        const eventWeeklySnapshot = await eventWeeklyRef.get()
        const chatsSnapshot = await chatRef.get()
        const userEventsSnapshot = await userEventRef.get()

        const PastDate = new Date()
        PastDate.setDate(PastDate.getDate() - 42);
        const deletedEventIDs = []
        const deletedWeeklyEventIDs = []
        const dateCheck = []


        const bucketImages = []
        const deleteImages = []

        const eventImageList = []
        try {
            eventsSnapshot.forEach(element => {

                if (typeof (element.val().image)) {
                    if (typeof (element.val().image) == "object") {
                        element.val().image.forEach(element2 => {
                            eventImageList.push(element2.substring(element2.lastIndexOf("/") + 1, element2.indexOf("?")))
                        });
                    }
                }
            });
        } catch (error) {
            console.log(error)
        }

        try {
            eventWeeklySnapshot.forEach(element => {
                if (typeof (element.val().image)) {
                    if (typeof (element.val().image) == "object") {
                        element.val().image.forEach(element2 => {
                            eventImageList.push(element2.substring(element2.lastIndexOf("/") + 1, element2.indexOf("?")))
                        });
                    }
                }
            });
        } catch (error) {
            console.log(error)
        }


        try {
            const stoargeFiles = await admin.storage().bucket().getFiles("event_media");
            stoargeFiles[0].forEach(imageRef => {
                if (imageRef.name != 'event_media/') {
                    bucketImages.push(imageRef.name.substring(imageRef.name.lastIndexOf("/") + 1));
                }
            });
        } catch (error) {
            console.log(error)
            // Handle any errors
        };

        bucketImages.forEach(bimage => {
            if (eventImageList.includes(bimage)) {
                console.log
            } else {
                deleteImages.push(bimage)
            }
        });
        try {
            // deleteImages.forEach(element => {
            //     admin.storage().bucket().file("event_media/" + element).delete();
            // });

        } catch (error) {
            console.log(error)
        }


        eventsSnapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;
            var childData = childSnapshot.val();
            const eventOldRef = eventRef.child(key)

            if (childData.category == -1 || new Date(childData.eventStartDate) < PastDate) {
                deletedEventIDs.push(key)
                dateCheck.push(childData.eventStartDate)
                eventOldRef.remove()
            }
        })

        eventWeeklySnapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;
            var childData = childSnapshot.val();
            const eventWeeklyOldRef = eventWeeklyRef.child(key)

            if (childData.category == -1 || new Date(childData.eventStartDate) < PastDate) {
                eventWeeklyOldRef.remove()
                deletedWeeklyEventIDs.push(key)
            }
        })

        userEventsSnapshot.forEach(function (childUserEventSnapshot) {
            var key = childUserEventSnapshot.key;
            var childData = childUserEventSnapshot.val();
            if (deletedEventIDs.includes(childData.eventID) || deletedWeeklyEventIDs.includes(childData.eventID)) {
                chatRef.child(key).remove()
            }
        })
        chatsSnapshot.forEach(function (childChatSnapshot) {
            var key = childChatSnapshot.key;
            var childData = childChatSnapshot.val();
            if (deletedEventIDs.includes(childData.eventID) || deletedWeeklyEventIDs.includes(childData.eventID)) {
                userEventRef.child(key).remove()
            }
        })

        if (eventsSnapshot) {
            res.json({ resultEvent: deletedEventIDs, resultWeeklyEvent: deletedWeeklyEventIDs, datacheck: dateCheck });
        } else {
            res.json({ result: `function failed, why?:` + eventsSnapshot });
        }


    });

exports.repeatEvents = functions.pubsub.schedule('5 1 * * *')
    .timeZone('Europe/London')
    .onRun(async (req, res) => {
        // exports.repeatEvents = functions.https.onRequest(async (req, res) => {
        var test = "";
        var test2 = "";
        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events")
        const eventChainRef = dbRef.child("eventchain")
        const eventWeeklyRef = dbRef.child("eventweekly")

        const eventsSnapshot = await eventRef.get()
        const eventWeeklySnapshot = await eventWeeklyRef.get()
        const eventChainSnapshot = await eventChainRef.get()
        const today = new Date()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1);




        eventsSnapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;
            var childData = childSnapshot.val();
            const eventOldRef = eventRef.child(key)

            if (childData.repeat == true && childData.deleted != true && childData.draft == false && new Date(childData.eventStartDate) < today) {

                var oldChain = null
                var newChain = null

                eventChainSnapshot.forEach(function (childSnapshot) {
                    var chainKey = childSnapshot.key;
                    if (chainKey == key) {
                        oldChain = childSnapshot.val()
                        newChain = Object.assign({}, childSnapshot.val());
                        newChain.createdAt = new Date();
                    }
                })

                if (oldChain) {

                    if (newChain.eventChainID.includes("*")) {
                        const aliteration = parseInt(newChain.eventChainID.substring(newChain.eventChainID.indexOf("*") + 1))
                        newChain.eventChainID = newChain.eventChainID.substring(0, newChain.eventChainID.indexOf("*") + 1) + String(aliteration + 1)

                    } else {
                        newChain.eventChainID = newChain.eventChainID + "*1"
                    }
                }
                const oldEvent = childData
                const newEvent = Object.assign({}, childData);
                const nextWeek = new Date(childData.eventStartDate)
                nextWeek.setDate(nextWeek.getDate() + 7);

                oldEvent.deleted = true
                newEvent.deleted = false
                newEvent.eventStartDate = nextWeek.toISOString()
                newEvent.originalEventID = key

                eventOldRef.set(oldEvent)

                const newEventID = eventRef.push(newEvent)

                if (newChain) {
                    const newChainRef = eventChainRef.child(newEventID.getKey())
                    newChainRef.set(newChain)
                }
                test = String(newEvent.id)
            }

        })
        eventWeeklySnapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;
            var childData = childSnapshot.val();
            const eventWeeklyOldRef = eventWeeklyRef.child(key)

            if (childData.repeat == true && childData.deleted != true && childData.draft == false && new Date(childData.eventEndDate) < today) {
                const newActiveDates = []
                const newStrActiveDates = []
                const oldEvent = childData
                const newEvent = Object.assign({}, childData);

                newEvent.activeEventDates.forEach(activeDate => {
                    const nextActiveDate = new Date(activeDate)
                    nextActiveDate.setDate(nextActiveDate.getDate() + 7)
                    newActiveDates.push(nextActiveDate)
                    newStrActiveDates.push(nextActiveDate.toISOString())

                })
                newEvent.activeEventDates = newStrActiveDates
                const orderedDates = newActiveDates.sort(function (a, b) {
                    return Date.parse(a) > Date.parse(b);
                });
                oldEvent.deleted = true
                newEvent.deleted = false
                newEvent.eventStartDate = orderedDates[0].toISOString()
                newEvent.eventEndDate = orderedDates[orderedDates.length - 1].toISOString()
                newEvent.originalEventID = key



                if (newEvent.description != "" && newEvent.activeEventDates) {
                    console.log("updating date info")
                    var tempDateDescription = newEvent.description
                    orderedDates.forEach(element => {
                        const tempDateInfo = dateToWeekDescriptionFormat(element)
                        const dayNameIndex = tempDateDescription.indexOf(tempDateInfo.substring(0, 3))
                        if (dayNameIndex > -1) {
                            if (tempDateDescription.indexOf(":", dayNameIndex) + 2 == tempDateDescription.indexOf("\n", dayNameIndex))
                                tempDateDescription = tempDateDescription.slice(0, dayNameIndex) + tempDateInfo + tempDateDescription.slice(tempDateDescription.indexOf(":", dayNameIndex))
                        }
                        newEvent.description = tempDateDescription

                    });
                }

                eventWeeklyOldRef.set(oldEvent)
                eventWeeklyRef.push(newEvent)
                test2 = String(newEvent.activeEventDates) + "  ======start==== " + newEvent.eventStartDate + "  ======end==== " + newEvent.eventEndDate
                test2 = newEvent.description
            }

        })



        // Send back a message that we've successfully written the message
        if (eventsSnapshot) {
            res.json({ resultEvent: `events retrived:` + test, resultWeeklyEvent: `eventWeekly retrived:` + test2 });
        } else {
            res.json({ result: `function failed, why?:` + eventsSnapshot });
        }
    });

exports.presentFeatured2 = functions.https.onRequest(async (req, res) => {
    // exports.presentFeatured = functions.pubsub.schedule('10 1 * * *')
    // .timeZone('Europe/London')
    // .onRun(async (req, res) => {

    const dbRef = admin.database().ref();
    const eventRef = dbRef.child("events")
    const userRef = dbRef.child("users")
    const eventWeeklyRef = dbRef.child("eventweekly")
    const companyRef = dbRef.child("companies")
    const exposedEventsRef = dbRef.child("eventsexposed")

    exposedEventsRef.remove()

    const eventsSnapshot = await eventRef.get()
    const eventWeeklySnapshot = await eventWeeklyRef.get()
    const usersSnapshot = await userRef.get()
    const companySnapshot = await companyRef.get()

    const activeAdEventIDs = []
    companySnapshot.forEach(function (childSnapshot) {
        var childData = childSnapshot.val();
        if (childData.activeAdEventIDs) {
            activeAdEventIDs.push(...childData.activeAdEventIDs)
        }
    })

    const relevantEvents = []
    const relevantEventsTest = []
    const usersForEvents = []


    eventsSnapshot.forEach(function (childSnapshot) {
        var key = childSnapshot.key;
        if (activeAdEventIDs.includes(key) && new Date(childSnapshot.val()["eventStartDate"]) >= new Date()) {
            const newItem = childSnapshot.val()
            newItem["id"] = key
            relevantEvents.push(Object.assign({}, newItem))
            relevantEventsTest.push(childSnapshot.val())
        }
    })
    eventWeeklySnapshot.forEach(function (childSnapshot) {
        var key = childSnapshot.key;
        if (activeAdEventIDs.includes(key) && new Date(childSnapshot.val()["eventEndDate"]) >= new Date()) {
            const newItem = childSnapshot.val()
            newItem["id"] = key
            relevantEvents.push(Object.assign({}, newItem))
            relevantEventsTest.push(childSnapshot.val())
        }
    })
    // console.log("event Featured List")
    relevantEvents.forEach(eventItem => {
        const userItem = usersSnapshot.child(eventItem.organiser)
        usersForEvents.push(userItem.val()["name"])
        if (userItem.val()["name"]) {
            eventItem["organiserName"] = userItem.val()["name"]
            eventItem["organiserUsername"] = userItem.val()["username"]
            eventItem["organiserImage"] = userItem.val()["image"] ? userItem.val()["image"] : null
            // exposedEventsRef.push(eventItem)
            const specificEventRef = exposedEventsRef.child(eventItem["id"])
            specificEventRef.set(eventItem)
            // exposedEventsRef.push(eventItem["id"]=eventItem)
        }
    });

    if (relevantEvents) {
        res.json({ result: relevantEvents, featuredIDs: activeAdEventIDs, user: usersForEvents });
    } else {
        res.json({ result: `function failed, why?:` + relevantEvents });
    }



});

const uploadImage = async (base64Img) => {
    // Convert the base64 string back to an image to upload into the Google Cloud Storage bucket
    const filename = crypto.randomUUID()

    const imageStorageRef = (admin.storage().bucket().file("/event_media/" + filename + ".jpg"))
    var imgBuffer = new Buffer.from(base64Img.substring(22), 'base64url')
    await imageStorageRef.save(imgBuffer, {
        contentType: 'image/jpeg'
    }).catch(err => {
        console.error("Upload bad!", err);
        response.send('0');
    });
    
    return ([await imageStorageRef.publicUrl()])
}


const setEventValues = (placeholder, newData) => {
    placeholder["adminEvent"] = false;
    placeholder["adminReward"] = null;
    placeholder["category"] = newData.category;
    placeholder["createdAt"] = new Date();
    placeholder["deleted"] = false;
    placeholder["description"] = newData.description;
    placeholder["draft"] = false;
    placeholder["eventName"] = newData.eventName;
    placeholder["eventStartDate"] = newData.eventStartDate;
    placeholder["eventStartTime"] = newData.eventStartTime;
    placeholder["fullLocation"] = newData.fullLocation;
    placeholder["hashtags"] = newData.hashtags;
    placeholder["hideFullLocation"] = false;
    placeholder["image"] = newData.image;
    placeholder["incognitoLocation"] = "";
    placeholder["longlat"] = newData.longlat;
    placeholder["mute"] = true;
    placeholder["open"] = true;
    placeholder["organiser"] = newData.organiser;
    placeholder["postcode"] = newData.postcode;
    placeholder["price"] = newData.price;
    placeholder["notificationID"] = newData.notificationID ? newData.notificationID : null;
    placeholder["auxOrganisers"] = newData.auxOrganisers ? newData.auxOrganisers : null;
    placeholder["templateCompanyID"] = newData.templateCompanyID ? newData.templateCompanyID : null;
    placeholder["originalTemplateID"] = newData.originalTemplateID ? newData.originalTemplateID : null;
    placeholder["originalEventID"] = newData.originalEventID ? newData.originalEventID : null;
    placeholder["calenderID"] = newData.calenderID ? newData.calenderID : null;
    placeholder["companyEventID"] = newData.companyEventID ? newData.companyEventID : null;
    placeholder["paymentLink"] = newData.paymentLink ? newData.paymentLink : null;
    placeholder["groupCode"] = newData.groupCode ? newData.groupCode : null;
    placeholder["repeat"] = newData.repeat;
    placeholder["allowChat"] = false;
    return (placeholder)
}

const dateToWeekDescriptionFormat = (date) => {
    const nth = function (d) {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var day = days[date.getDay()];
    var month = months[date.getMonth()];
    return day + " " + date.getDate() + nth(date.getDate()) + " " + month

}

const getNextVaildDate = (eventDates) => {
    const today = new Date()
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const activeDates = eventDates ? eventDates.map(dateValue => { return (new Date(dateValue)) }) : ["2000-01-01T13:41:00.000Z"]
    var myDate = null
    activeDates.forEach(element => {
        if (element > startToday && myDate === null) {
            myDate = element
        }
    });
    return myDate ? myDate : new Date(activeDates[0])

}