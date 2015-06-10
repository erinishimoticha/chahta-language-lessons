"use strict";

module.exports = function(app, passport) {

    /**
     * Main page with Facebook login link.
     */
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    /**
     * Post-auth landing page.
     * TODO: protect this with isAuthenticated() and/or membership in our Facebook group
     */
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user: req.user
        });
    });

    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/');
}