import { getNextVaildDate } from './utils';
import {cors, storage, functions, admin} from './functionList/common.cjs'

export default functions.https.onRequest(async (req, res) => {
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