
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors')({ origin: true });
const storage = require('@google-cloud/storage');
const functions = require("firebase-functions");



// catholic sense
const firebaseConfig = {
    apiKey: "AIzaSyASjZVnv-mMwIyX2k4c0q1lNv2I1X8xZFg",
    authDomain: "catholicsense-f8d60.firebaseapp.com",
    databaseURL: "https://catholicsense-f8d60.firebaseio.com",
    projectId: "catholicsense-f8d60",
    storageBucket: "catholicsense-f8d60.appspot.com",
    messagingSenderId: "9478473522",
    appId: "1:9478473522:web:2d3f55c51edd0c75bfb92b",
    measurementId: "G-FFQ7EH7DZE"
};

// sense social
// const firebaseConfig = {
//     apiKey: "AIzaSyDHDVhLcShVWKXra5JfEJqkl5YNDR1DeU4",
//     authDomain: "sense-social.firebaseapp.com",
//     databaseURL: "https://sense-social.firebaseio.com",
//     projectId: "sense-social",
//     storageBucket: "sense-social.appspot.com",
//     messagingSenderId: "936426746276",
//     appId: "1:936426746276:web:5fbd44dc0be0f9ca509131",
//     measurementId: "G-DRFYEMC1RJ"
// };
// cred_obj = admin.credential.cert()
admin.initializeApp(firebaseConfig)


export {cors, admin ,storage,functions}