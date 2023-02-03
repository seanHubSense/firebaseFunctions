
import {cors, storage, functions, admin} from './common'

export default functions.https.onRequest(async (req, res) => {
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