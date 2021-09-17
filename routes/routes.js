// Imports
const User = require("../models/User.js")
const Link = require("../models/Link.js")
const bcrypt = require('bcrypt');


// App routing
function getHome(req, res) {
    res.render("index.html", { title: "NodeLink - Home" })
}

function getRegister(req, res) {
    res.render("register.html", { title: "NodeLink - Register", messages: req.flash("registerMessage") })
}

function getLogin(req, res) {
    res.render("login.html", { title: "NodeLink - Login", messages: req.flash("loginMessage") })
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
    res.render("dashboard.html", { title: "NodeLink - Dashboard", links: links, linksLength: links.length, messages: req.flash("dashboardMessage"), user: req.session.user });
}

function getCreateLink(req, res) {
    res.render("createLink.html", { title: "NodeLink - Create Link" });
}

async function postCreateLink(req, res) {
    const linkName = req.body.linkName;
    const linkURL = req.body.linkURL;
    let linkOwner = await User.findOne({ where: { id: req.session.user.id } });
    let link = await Link.create({ linkName: linkName, linkURL: linkURL, linkOwnerId: linkOwner.id }).catch((err) => { console.log("Error occurred when creating link...", err) })

    req.flash("dashboardMessage", `Link for ${linkName} has been created successfully.`)
    res.redirect("/dashboard")
}


async function getEditLink(req, res) {
    const link = await Link.findOne({ where: { id: req.params.linkId } });
    if (link && link.linkOwnerId === req.session.user.id) {
        res.render("editLink.html", { title: `NodeLink - ${link.linkName}`, defaultName: link.linkName, defaultURL: link.linkURL, linkId: link.id })
    }
    if (!link) {
        req.flash("dashboardMessage", "That link is invalid.")
        res.redirect('/dashboard')
    }

    if (link.linkOwnerId !== req.session.user.id) {
        req.flash("dashboardMessage", "You do not have permission to do that.")
        res.redirect('/dashboard')
    }

}


async function postEditLink(req, res) {
    const link = await Link.findOne({ where: { id: req.params.linkId } });
    const linkURL = req.body.linkURL;
    const linkName = req.body.linkName;

    if (link && link.linkOwnerId === req.session.user.id) {
        link.update({ linkName: linkName, linkURL: linkURL });
        req.flash("dashboardMessage", "Your link has been updated!")
        res.redirect("/dashboard")
    }

    if (!link) {
        req.flash("dashboardMessage", "That link is invalid.")
        res.redirect('/dashboard')
    }

    if (link.linkOwnerId !== req.session.user.id) {
        req.flash("dashboardMessage", "You do not have permission to do that.")
        res.redirect('/dashboard')
    }
}


async function deleteLink(req, res) {
    const link = await Link.findOne({ where: { id: req.params.linkId } });

    if (link && link.linkOwnerId === req.session.user.id) {
        await link.destroy();
        req.flash("dashboardMessage", "Your link has been deleted.");
        res.redirect("/dashboard")
    }

    if (!link) {
        req.flash("dashboardMessage", "That link is invalid.")
        res.redirect('/dashboard')
    }

    if (link.linkOwnerId !== req.session.user.id) {
        req.flash("dashboardMessage", "You do not have permission to do that.")
        res.redirect('/dashboard')
    }
}

function getAccountSettings(req, res) {
    const defaultUsername = req.session.user.username;
    const defaultEmail = req.session.user.email;

    res.render("account.html", { title: "NodeLink - Account", messages: req.flash("accountMessage"), defaultUsername: defaultUsername, defaultEmail: defaultEmail })
}

async function getUserProfile(req, res) {
    const user = await User.findOne({ where: { username: req.params.username } });
    if (user) {
        const username = user.username;
        const links = await Link.findAll({ where: { linkOwnerId: user.id } });

        res.render("user.html", { title: `NodeLink - ${username}`, links: links, user: user })
    }
    else {
        res.send("That user profile does not exist.")
    }
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
    postCreateLink: postCreateLink,
    getEditLink: getEditLink,
    postEditLink: postEditLink,
    deleteLink: deleteLink,
    getAccountSettings: getAccountSettings,
    getUserProfile: getUserProfile,
}