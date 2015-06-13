"use strict";

var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var baseUrl = "http://www.choctawschool.com";
var lessonPath = "/lesson-of-the-day.aspx";
var mediaPath = "media";
check();

function check() {
    console.log("Checking for a new lesson.");

    request(baseUrl + lessonPath, function (error, response, body) {
        var $;
        var lessonText;
        var imageUrl;
        var imageFilename;

        if (error || response.statusCode !== 200) {
            console.log("Can't access lesson of the day page. Giving up!", error || response.statusCode);
            process.exit();
        }

        $ = cheerio.load(body);
        lessonText = processLesson($);
        imageUrl = processImage($);
        imageFilename = imageUrl.replace(/.*\//, "/");
        console.log(lessonText);
        console.log(imageUrl);
        console.log(imageFilename);

        if (fs.existsSync(mediaPath + imageFilename)) {
            console.log("Old lesson, nothing to do.");
        }

        request.get({url: baseUrl + imageUrl, encoding: 'binary'}, function (err, response, body) {
            fs.writeFile(mediaPath + imageFilename, body, 'binary', function(err) {
                if (err) {
                    console.log("Can't access lesson of the day page. Giving up!", err);
                    process.exit();
                }
            });
        });
    });
}

function processImage($) {
    var children = $("#aspnetform")[0].children;
    var url;

    function processChild(each) {
        if (each.type === "tag" && each.name === "img") {
            url = each.attribs.src;
            return false;
        }

        if (each.children) {
            return each.children.every(processChild);
        } else {
            return true;
        }
    }

    children.every(processChild);
    return url;
}

function processLesson($) {
    var children = $("#aspnetform")[0].children;
    var text = "";
    var relevant;

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
    return text;
}
