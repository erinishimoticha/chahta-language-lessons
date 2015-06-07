var request = require('request');
var cheerio = require('cheerio');

var lessonUrl = "http://www.choctawschool.com/lesson-of-the-day.aspx";

request(lessonUrl, function (error, response, body) {
    if (error || response.statusCode !== 200) {
        console.log("Can't access lesson of the day page. Giving up!");
        process.exit();
    }

    processLesson(body);
});

function processLesson(body) {
    var $ = cheerio.load(body);
    var children = $("#aspnetform")[0].children;
    var tag;
    var text = "";

    function processChild(each) {
        if (each.type === "text" && each.data.match(/\S/)) {
            each.data.replace(/[\n\r]/i, "");
            text += each.data + "\n";
        }

        if (each.children) {
            each.children.forEach(processChild);
        }
    }

    children.forEach(processChild);
    console.log(text);
}
