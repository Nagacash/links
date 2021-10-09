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
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    const emailExists = await User.findOne({ where: { email: email } })
    const usernameExists = await User.findOne({ where: { username: username } })

    if (usernameExists || emailExists) {
        req.flash("registerMessage", "That username or email already belongs to an account. Please choose a different one.")
        res.redirect("/register")
    }

    if (!emailExists && !usernameExists) {
        bcrypt.hash(password, 12, async (err, hash) => {
            if (err) {
                console.log(err)
            }
            let newUser = await User.create({ firstName: firstName, lastName: lastName, email: email, username: username, password: hash }).catch((err) => { console.log("Error occurred when trying to create user ", err) })
            req.flash("loginMessage", "Your account has successfully been created!")
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
            res.redirect("/login")
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
    const defaultFirstName = req.session.user.firstName;
    const defaultLastName = req.session.user.lastName;
    const defaultUsername = req.session.user.username;
    const defaultEmail = req.session.user.email;
    const defaultBio = req.session.user.bio;

    res.render("account.html", { title: "NodeLink - Account", messages: req.flash("accountMessage"), defaultFirstName: defaultFirstName, defaultLastName: defaultLastName, defaultUsername: defaultUsername, defaultEmail: defaultEmail, defaultBio: defaultBio })
}

async function postAccountSettings(req, res) {
    const newFirstName = req.body.firstName;
    const newLastName = req.body.lastName;
    const newUsername = req.body.username;
    const newEmail = req.body.email;
    const bio = req.body.bio;
    const currentUser = await User.findOne({ where: { id: req.session.user.id } });

    if (newFirstName !== currentUser.firstName) {
        await currentUser.update({ firstName: newFirstName }).then(() => { console.log("First name updated successfully.") }).catch((err) => { console.log("Error occurred when updating first name", err) });
        req.session.user.firstName = newFirstName;
    }

    if (newLastName !== currentUser.lastName) {
        await currentUser.update({ lastName: newLastName }).then(() => { console.log("Last name updated successfully.") }).catch((err) => { console.log("Error occurred when updating last name", err) });;
        req.session.user.lastName = newLastName;
    }

    if (newUsername !== currentUser.username) {
        const exists = await User.findOne({ where: { username: newUsername } });
        if (!exists) {
            await currentUser.update({ username: newUsername }).then(() => { console.log("Username updated successfully") }).catch((err) => { console.log("Error occurred when updating username", err) });
            req.session.user.username = newUsername;
        }
        if (exists) {
            req.flash("accountMessage", "That username already belongs to another user. Please choose a different one.")
        }
    }

    if (newEmail !== currentUser.email) {
        const exists = await User.findOne({ where: { email: newEmail } })
        if (!exists) {
            await currentUser.update({ email: newEmail }).then(() => { console.log("Email updated successfully") }).catch((err) => { console.log("Error occurred when updating email", err) });
            req.session.user.email = newEmail;
        }
        if (exists) {
            req.flash("accountMessage", "That email already belongs to another user. Please choose a different one.")
        }
    }

    if (bio !== currentUser.bio) {
        await currentUser.update({ bio: bio }).then(() => { console.log("Bio updated successfully") }).catch((err) => { console.log("Error occurred when updating bio", err) });
        req.session.user.bio = bio;
    }

    req.flash("accountMessage", "Settings updated successfully!")

    res.redirect("/account")
}


async function getChangePassword(req, res) {
    res.render("changePassword.html", { title: "NodeLink - Change Password", messages: req.flash("changePasswordMessage") })
}

async function postChangePassword(req, res) {
    const currentUser = await User.findOne({ where: { id: req.session.user.id } })
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    const passwordMatch = await bcrypt.compare(currentPassword, currentUser.password)

    if (passwordMatch) {
        bcrypt.hash(newPassword, 12, async (err, hash) => {
            if (err) {
                console.log(err)
            }
            await currentUser.update({ password: hash }).then(() => { console.log("Password updated successfully.") }).catch((err) => { console.log("Error occurred when updating password", err) })
            req.flash("accountMessage", "Your password has been updated successfully!")
            res.redirect("/account")
        })
    }
    if (!passwordMatch) {
        req.flash('changePasswordMessage', "Your current password is invalid. Please enter in the correct current password in order to update your password.")
        res.redirect("/change-password")
    }
}


async function getEditSite(req, res) {
    const defaultBgColor = req.session.user.bgColor;
    const defaultLinkBgColor = req.session.user.linkBgColor;
    const defaultLinkColor = req.session.user.linkColor;
    const defaultTextColor = req.session.user.textColor;

    res.render("editSite.html", { title: "NodeLink - Edit Site", messages: req.flash("editSiteMessage"), defaultBgColor: defaultBgColor, defaultLinkBgColor: defaultLinkBgColor, defaultLinkColor: defaultLinkColor, defaultTextColor: defaultTextColor });
}

async function postEditSite(req, res) {
    const bgColor = req.body.bgColor;
    const linkBgColor = req.body.linkBgColor;
    const linkColor = req.body.linkColor;
    const textColor = req.body.textColor;
    const currentUser = await User.findOne({ where: { id: req.session.user.id } });

    await currentUser.update({ bgColor: bgColor, linkBgColor: linkBgColor, linkColor: linkColor, textColor: textColor }).then(() => { console.log("Site settings updated successfully!") }).catch((err) => { console.log("Error occurred when updating site", err) })
    req.session.user.bgColor = bgColor;
    req.session.user.linkBgColor = linkBgColor;
    req.session.user.linkColor = linkColor;
    req.session.user.textColor = textColor;

    req.flash("dashboardMessage", "Your site appearance has been successfully updated!")
    res.redirect("/dashboard")
}

async function getAnalytics(req, res) {
    const user = await User.findOne({ where: { id: req.session.user.id } });
    res.render("analytics.html", { title: "NodeLink - Analytics", user: user })
}

async function getUserProfile(req, res) {
    const user = await User.findOne({ where: { username: req.params.username } });
    if (user) {
        const username = user.username;
        const links = await Link.findAll({ where: { linkOwnerId: user.id } });
        if (req.session.user) {
            if (user.id !== req.session.user.id) {
                user.views++;
                user.save();
            }
        }
        if (req.session.user == null) {
            user.views++;
            user.save();
        }
        res.render("user.html", { title: `NodeLink - ${username}`, links: links, user: user })
    }
    else {
        if (req.session.user) {
            res.render("loggedIn404.html", { title: "NodeLink - 404 Not Found" })
        }
        if (req.session.user == null) {
            res.render("loggedOut404.html", { title: "NodeLink - 404 Not Found" })
        }
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
    postAccountSettings: postAccountSettings,
    getChangePassword: getChangePassword,
    postChangePassword: postChangePassword,
    getEditSite: getEditSite,
    postEditSite: postEditSite,
    getAnalytics: getAnalytics,
    getUserProfile: getUserProfile
}