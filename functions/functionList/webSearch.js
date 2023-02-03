import { getNextVaildDate } from './utils';
import {cors, storage, functions, admin} from './common'

export default functions.https.onRequest(async (req, res) => {
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
