
import {cors, storage, functions, admin} from './common'

export default functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramPhone = "+" + req.query.phoneNo.trim()
        const paramPassword = Number(req.query.password)
        const dbRef = admin.database().ref();
        const eventRef = dbRef.child("events")
        const userRef = dbRef.child("users")
        const usersSnapshot = await userRef.get()

        console.log(paramPhone)
        console.log(paramPassword)
        const addID = (obj, id) => {
            const targetEventItem = Object.assign({}, obj)
            targetEventItem["key"] = id
            return targetEventItem
        }
        const userArray = Object.keys(usersSnapshot.val()).map((key) => addID(usersSnapshot.val()[key], key));

        const userFilter = (item) => {
            if (item["webPass"] === paramPassword) { return (item) }
        }
        const activeUser = userArray.find(userFilter)
        console.log(activeUser)
        const orgainisedFilter = (item) => {
            if (item["organiser"] === activeUser.key && item["deleted"] === false && item["draft"] !== true) return (item)
        }

        if (activeUser) {
            const eventsSnapshot = await eventRef.get()
            const eventArray = Object.keys(eventsSnapshot.val()).map((key) => addID(eventsSnapshot.val()[key], key));
            const organisedEventList = eventArray.filter(orgainisedFilter)

            res.json({ result: 200, organisedEvent: organisedEventList, user: activeUser });
        } else {
            res.json({ result: 401, message: `invaild user` });
        }
    })
});
