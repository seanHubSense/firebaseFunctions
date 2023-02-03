import { setEventValues } from './utils';
import {cors, storage, functions, myAdmin} from './common.cjs'

export default functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const paramPhone = "+" + req.query.phoneNo.trim()
        const paramPassword = Number(req.query.password)
        const dbRef = admin.database().ref();
        const paramEventBody = req.body
        const userRef = dbRef.child("users")
        const usersSnapshot = await userRef.get()
        const newID = admin.firestore().collection('events').doc().id;
        const eventRef = dbRef.child("events").child(newID)


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
            if (paramEventBody.image.indexOf("firebasestorage.googleapis.com") === -1){
                const imageUrl = uploadImage(paramEventBody.image)

                paramEventBody.image = imageUrl
            }
            const newEventItem = setEventValues({},paramEventBody)
            console.log(newEventItem)
            // eventRef.set(newEventItem)

            res.json({ result: 200, targetEvent: newEventItem });
        } else {
            res.json({ result: 501, message: `function failed, why?:` + targetEventItem });
        }
    })
});