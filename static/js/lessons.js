var app = angular.module('ChoctawLessons', ['ngResource']);

app.factory("Lessons", function ($resource) {
    return $resource("/lessons");
});

app.controller('LessonsCtrl', function ($scope, Lessons) {
    Lessons.query(function (lessons) {
        console.log(lessons);
        $scope.lessons = lessons.slice(0, 10);
    });
});
