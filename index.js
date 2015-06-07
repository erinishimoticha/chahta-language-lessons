var request = require('request');

var lessonUrl = "http://www.choctawschool.com/lesson-of-the-day.aspx";

request(lessonUrl, function (error, response, body) {
    if (error || response.statusCode !== 200) {
        console.log("Can't access lesson of the day page. Giving up!");
        process.exit();
    }

    processLesson(body);
});

function processLesson(body) {
    console.log(body);
}
