"use strict";

var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var async = require('async');
var allPages = {};

try {
    allPages = require('./pageinfo.json');
} catch (err) { /* start fresh */ }


var baseUrl = "http://www.choctawschool.com";
var lessonPath = "/lesson-of-the-day.aspx";
var mediaPath = "static/media";

iterate();

/**
 * Iterate through the menu of lessons on the index page, processing each page in turn, saving
 * the lesson in JSON and the image to disk.
 */
function iterate() {
    var actions = [];

    request(baseUrl + lessonPath, function (error, response, body) {
        var $;
        var lines;

        if (error || response.statusCode !== 200) {
            console.log("Can't access lesson of the day page. Giving up!", error || response.statusCode);
            process.exit();
        }

        $ = cheerio.load(body);
        // menunav_side is the <ul>
        lines = $("#menunav_side")[0].children;
        lines.forEach(function (line) {
            // each line is an <li> which is a category of lessons
            // the first child of each <li> is an <a> with a description in it.
            var li = line.children[0];
            var href = li.attribs.href;
            var description = li.children[0].data;
            if (description.replace(/\s/g, "").toLowerCase().indexOf('signup') > -1) {
                return;
            }
            // Most <li> have a child <ul> which have the actual lesson links in them.
            var ul = line.children.filter(function (subLine) {
                return subLine.name === 'ul';
            })[0];

            if (!ul) {
                return;
            }
            // These <li> are the actual lesson pages.
            ul.children.forEach(function (li) {
                if (li.name !== 'li' || li.children[0].attribs.href.indexOf('choctaw-alphabet') > -1) {
                    // filter the initial description div and non-vocabulary pages
                    return;
                }
                console.log(li.children[0].attribs.href);
                actions.push(check(baseUrl + li.children[0].attribs.href, description));
            });
        });

        // Download the images one after another
        async.series(actions, function (err, results) {
            if (err) {
                console.log("error", err.message);
                return;
            }
            // Consolidate all the results, using the image filename as a unique key
            results.forEach(function (result) {
                if (allPages[result.imageUrl] && result.imageUrl) {
                    // already got this one.
                    console.log('already downloaded', result);
                    return;
                }
                allPages[result.imageUrl] = result;
            });

            // now we have a true set of the images we need to download.
            console.log("attempting to download", Object.keys(allPages).length);
            async.series(Object.keys(allPages).map(function (imageUrl) {
                if (imageUrl) {
                    return downloadImage(allPages[imageUrl]);
                } else {
                    return function (next) { next(); };
                }
            }), function () {
                // save lesson data
                fs.writeFile('pageinfo.json', JSON.stringify(allPages, null, 4), function (err) {
                    if (err) {
                        console.log("Couldn't write info file.", err.message);
                        return;
                    }

                    console.log('done');
                });
            });
        });
    });
}

/**
 * Construct an async.series function to pull this url and save lesson and image data.
 */
function check(url, description) {
    return function reallyCheck(next) {
        console.log("Checking", description, url);
        request(url, function (error, response, body) {
            var $;
            var info = {
                pageUrl: url,
                description: description,
                downloaded: false,
                imageUrl: "",
                filename: "",
                text: ""
            };

            if (error || response.statusCode !== 200) {
                next(new Error("Can't access lesson of the day page. Giving up!", error || response.statusCode));
                return;
            }

            $ = cheerio.load(body);
            info.text = processLesson($);
            info.imageUrl = processImage($);

            // This will be formatted weirdly on the webpage, and we'll check it manually
            if (!info.imageUrl) {
                next(null, info);
                return;
            }

            // We'll attempt to download these images later.
            info.filename = info.imageUrl.replace(/.*\//, "/");

            if (fs.existsSync(mediaPath + info.filename)) {
                info.downloaded = true;
            }
            next(null, info);
        });
    };
}

/**
 * Construct an async.series function to download the images. This will set obj.downloaded to true
 * if the download goes successfully.
 */
function downloadImage(info) {
    return function reallyDownloadImage(cb) {
        console.log("starting download");
        if (info.downloaded) {
            console.log("already downloaded");
            cb();
            return;
        }
        request.get({url: baseUrl + info.imageUrl, encoding: 'binary'}, function (err, response, body) {
            console.log("writing", mediaPath + info.filename);
            fs.writeFile(mediaPath + info.filename, body, 'binary', function(err) {
                if (err) {
                    console.log("Can't access lesson of the day image." + err.message);
                    cb(); // don't cancel all the other downloads
                    return;
                }
                console.log("done downloading");
                info.downloaded = true;
                cb();
            });
        });
    };
}

/**
 * On each lesson page, recursively search for the lesson image.
 */
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

/**
 * On each lesson page, recursively save bits of text from the HTML elements to reconstruct the lesson text.
 */
function processLesson($) {
    var children = $("#aspnetform")[0].children;
    var text = "";
    var relevant;

    function processChild(each) {
        if (each.data) {
            if (relevant === undefined && (
                        // Different versions of the page use different beginning phrases before
                        // printing the text of the lesson. Filter it out.
                        each.data.match(/vocab/i) ||
                        each.data.match(/hear the sentences/i) ||
                        each.data.match(/hear the dialogue/i) ||
                        each.data.match(/pronun/i)
                    )) {
                relevant = true;
                each.data = each.data.replace(/.*(vocabulary|pronunciation|sentences|dialogue)(:|\.)\s*/i, "");
            } else if (each.data.match(/download/i)) {
                relevant = false;
            }
        }

        // Only save the bit of text if we've passed the introduction text and there is actually some
        // language in the element, and replace newlines, because the links and bolding and other
        // HTML elements make newlines show up at invalid locations in the text.
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
