"use strict";

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
    var relevant = undefined;

    function processChild(each) {
        if (each.data) {
            if (relevant === undefined && each.data.match(/vocab/i)) {
                relevant = true;
                each.data = each.data.replace(/vocabulary: */i, "");
            } else if (each.data.match(/download/i)) {
                relevant = false;
            }
        }

        if (each.type === "text" && each.data.match(/\S/) && relevant) {
            each.data = each.data.replace(/[\n\r]/i, " ");
            text += each.data + "\n";
        }

        if (each.children) {
            each.children.forEach(processChild);
        }
    }

    children.forEach(processChild);
    console.log(text);
}
