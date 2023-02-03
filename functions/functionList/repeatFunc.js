import { dateToWeekDescriptionFormat } from './utils';
import {cors, storage, functions, admin} from './common'

export default functions.pubsub.schedule('5 1 * * *')
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