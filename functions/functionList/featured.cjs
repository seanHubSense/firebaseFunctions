// import {cors, storage, functions, admin} from './common.cjs'
const cors, storage, functions, admin = require('./common.cjs');



const featured  = (functions, admin)=> functions.pubsub.schedule('10 1 * * *')
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

    export default featured;