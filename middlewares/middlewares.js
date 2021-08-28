function loginRequired(req, res, next) {
    if (req.session.user) {
        next();
    }

    if (!req.session.user) {
        req.flash("loginMessage", "Please login to access this page.")
        res.redirect("/login");
    }
}

function logoutRequired(req, res, next) {
    if (req.session.user) {
        req.flash("dashboardMessage", "You are currently logged in. You will need to logout to access that page.")
        res.redirect("/dashboard")
    }

    if (!req.session.user) {
        next();
    }

}

module.exports = {
    loginRequired: loginRequired,
    logoutRequired: logoutRequired
}