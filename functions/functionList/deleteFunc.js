import {cors, storage, functions, admin} from './common'

export default functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramPhone = "+" + req.query.phoneNo.trim()
        const paramPassword = Number(req.query.password)
        const paramEventBody = req.body
        const paramEventID = paramEventBody.key
        const dbRef = admin.database().ref();
        const userRef = dbRef.child("users")
        const usersSnapshot = await userRef.get()
        const specificEventRef = dbRef.child("events").child(paramEventID)
        const eventSnapshot = await specificEventRef.get()
        const targetEventItem = Object.assign({}, eventSnapshot.val())

        const addID = (obj, id) => {
            const targetEventItem = Object.assign({}, obj)
            targetEventItem["key"] = id
            return targetEventItem
        }
        const userArray = Object.keys(usersSnapshot.val()).map((key) => addID(usersSnapshot.val()[key], key));

        const userFilter = (item) => {
            if (item["number"] === paramPhone && item["webPass"] === paramPassword) { return (item) }
        }
        const activeUser = userArray.find(userFilter)


        if (activeUser) {
            targetEventItem["deleted"] = true;
            
            console.log(targetEventItem)
            // specificEventRef.set(newEventItem)

            res.json({ result: 200, key: paramEventID });
        } else {
            res.json({ result: 501, message: `function failed, why` });
        }
    })
});