const setEventValues = (placeholder, newData) => {
    placeholder["adminEvent"] = false;
    placeholder["adminReward"] = null;
    placeholder["category"] = newData.category;
    placeholder["createdAt"] = new Date();
    placeholder["deleted"] = false;
    placeholder["description"] = newData.description;
    placeholder["draft"] = false;
    placeholder["eventName"] = newData.eventName;
    placeholder["eventStartDate"] = newData.eventStartDate;
    placeholder["eventStartTime"] = newData.eventStartTime;
    placeholder["fullLocation"] = newData.fullLocation;
    placeholder["hashtags"] = newData.hashtags;
    placeholder["hideFullLocation"] = false;
    placeholder["image"] = newData.image;
    placeholder["incognitoLocation"] = "";
    placeholder["longlat"] = newData.longlat;
    placeholder["mute"] = true;
    placeholder["open"] = true;
    placeholder["organiser"] = newData.organiser;
    placeholder["postcode"] = newData.postcode;
    placeholder["price"] = newData.price;
    placeholder["notificationID"] = newData.notificationID?newData.notificationID:null;
    placeholder["auxOrganisers"] = newData.auxOrganisers?newData.auxOrganisers:null;
    placeholder["templateCompanyID"] = newData.templateCompanyID?newData.templateCompanyID:null;
    placeholder["originalTemplateID"] = newData.originalTemplateID?newData.originalTemplateID:null;
    placeholder["originalEventID"] = newData.originalEventID?newData.originalEventID:null;
    placeholder["calenderID"] = newData.calenderID?newData.calenderID:null;
    placeholder["companyEventID"] = newData.companyEventID?newData.companyEventID:null;
    placeholder["paymentLink"] = newData.paymentLink?newData.paymentLink:null;
    placeholder["groupCode"] = newData.groupCode?newData.groupCode:null;
    placeholder["repeat"] = newData.repeat;
    placeholder["allowChat"] = false;
    return (placeholder)
}

const dateToWeekDescriptionFormat = (date) => {
    const nth = function (d) {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var day = days[date.getDay()];
    var month = months[date.getMonth()];
    return day + " " + date.getDate() + nth(date.getDate()) + " " + month

}

const getNextVaildDate = (eventDates) => {
    const today = new Date()
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const activeDates = eventDates ? eventDates.map(dateValue => { return (new Date(dateValue)) }) : ["2000-01-01T13:41:00.000Z"]
    var myDate = null
    activeDates.forEach(element => {
        if (element > startToday && myDate === null) {
            myDate = element
        }
    });
    return myDate ? myDate : new Date(activeDates[0])

}

export { getNextVaildDate, dateToWeekDescriptionFormat, setEventValues}