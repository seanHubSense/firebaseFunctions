import { getNextVaildDate } from './utils';
import {cors, storage, functions, admin} from './common'

export default functions.https.onRequest(async (req, res) => {
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