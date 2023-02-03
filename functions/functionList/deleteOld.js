
import {cors, storage, functions, admin} from './common'

export default functions.pubsub.schedule('0 1 * * *')
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



// exports.deleteImages = functions.https.onRequest(async (req, res) => {

//     const dbRef = admin.database().ref();
//     const eventRef = dbRef.child("events")
//     const eventWeeklyRef = dbRef.child("eventweekly")

//     const eventsSnapshot = await eventRef.get()
//     const eventWeeklySnapshot = await eventWeeklyRef.get()

//     const bucketImages = []
//     const deleteImages = []

//     const eventImageList = []
//     try {
//         eventsSnapshot.forEach(element => {

//             if (typeof (element.val().image)) {
//                 if (typeof (element.val().image) == "object") {
//                     element.val().image.forEach(element2 => {
//                         eventImageList.push(element2.substring(element2.lastIndexOf("/") + 1, element2.indexOf("?")))
//                     });
//                 }
//             }
//         });
//     } catch (error) {

//     }

//     try {
//         eventWeeklySnapshot.forEach(element => {
//             if (typeof (element.val().image)) {
//                 if (typeof (element.val().image) == "object") {
//                     element.val().image.forEach(element2 => {
//                         eventImageList.push(element2.substring(element2.lastIndexOf("/") + 1, element2.indexOf("?")))
//                     });
//                 }
//             }
//         });
//     } catch (error) {

//     }


//     try {
//         const stoargeFiles = await admin.storage().bucket().getFiles("event_media");
//         stoargeFiles[0].forEach(imageRef => {
//             if (imageRef.name != 'event_media/') {
//                 bucketImages.push(imageRef.name.substring(imageRef.name.lastIndexOf("/") + 1));
//             }
//         });
//     } catch {
//         console.log("error")
//         // Handle any errors
//     };

//     bucketImages.forEach(bimage => {
//         if (eventImageList.includes(bimage)) {
//             console.log
//         } else {
//             deleteImages.push(bimage)
//         }
//     });
//     try {
//         deleteImages.forEach(element => {
//             admin.storage().bucket().file("event_media/" + element).delete();
//         });

//     } catch (error) {

//     }
//     res.json({ result: `images` + deleteImages });

// });


// exports.deleteOldEvents = functions.https.onRequest(async (req, res) => {