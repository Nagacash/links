// Imports
const User = require("../models/User.js")
const Link = require("../models/Link.js")
const bcrypt = require('bcrypt');


// App routing
function getHome(req, res) {
    res.render("index.html", { title: "Express Link - Home" })
}

function getRegister(req, res) {
    res.render("register.html", { title: "Express Link - Register", messages: req.flash("registerMessage") })
}

function getLogin(req, res) {
    res.render("login.html", { title: "Express Link - Login", messages: req.flash("loginMessage") })
}

async function postRegister(req, res) {
    const email = req.body.email
    const username = req.body.username
    const password = req.body.password

    const userExists = await User.findOne({ where: { email: email } })
    if (userExists) {
        req.flash("registerMessage", "That username or email already exists. Please choose a different one.")
        res.redirect("/register")
    }
    if (!userExists) {
        bcrypt.hash(password, 12, async (err, hash) => {
            if (err) {
                console.log(err)
            }
            let newUser = await User.create({ email: email, username: username, password: hash }).catch((err) => { console.log("Error occurred when trying to create user ", err) })
            res.redirect("/login")
        })
    }
}

async function postLogin(req, res) {
    const username = req.body.username
    const password = req.body.password

    const user = await User.findOne({ where: { username: username } })
    if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) {
            req.flash("loginMessage", "Password is invalid.")
        }
        if (passwordMatch) {
            req.session.user = user
            res.redirect("/dashboard")

        }
    }

    if (!user) {
        req.flash("loginMessage", "This account does not exist.")
        res.redirect("/login")
    }
}

function logout(req, res) {
    req.session.user = null;
    req.flash("loginMessage", "You have been logged out.");
    res.redirect("/login");
}

async function getDashboard(req, res) {
    let links = await Link.findAll({
        where: {
            linkOwnerId: req.session.user.id
        }
    });
    res.render("dashboard.html", { title: "Express Link - Dashboard", links: links, linksLength: links.length, messages: req.flash("dashboardMessage") });
}

function getCreateLink(req, res) {
    res.render("create-link.html", { title: "Express Link - Create Link" });
}

async function postCreateLink(req, res) {
    const linkName = req.body.linkName;
    const linkURL = req.body.linkURL;
    let linkOwner = await User.findOne({ where: { username: req.session.user.username } });
    let link = await Link.create({ linkName: linkName, linkURL: linkURL, linkOwnerId: linkOwner.id }).catch((err) => { console.log("Error occurred when creating link...", err) })

    req.flash("dashboardMessage", `Link for ${linkName} has been created successfully.`)
    res.redirect("/dashboard")

}

module.exports = {
    getHome: getHome,
    getRegister: getRegister,
    getLogin: getLogin,
    postRegister: postRegister,
    postLogin: postLogin,
    logout: logout,
    getDashboard: getDashboard,
    getCreateLink: getCreateLink,
    postCreateLink: postCreateLink
}