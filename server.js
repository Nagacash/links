const express = require('express');
const app = express();
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require("dotenv");
dotenv.config();
const nunjucks = require('nunjucks');


// Templating Engine
nunjucks.configure("views", {
    autoescape: true,
    express: app
});


// Database
const db = require('./config/database.js');
db.authenticate().then(() => {
    console.log("Connected!")
}).catch((err) => {
    console.log("Unable to connect :(", err)
})

const User = require("./models/User.js")
const Link = require("./models/Link.js")

// A user can have many links and you can query them by User.links(...)
User.hasMany(Link, { as: "links", onDelete: "CASCADE" })

// A link belongs to one user and that user is the linkOwner
Link.belongsTo(User, { as: "linkOwner", foreignKey: "linkOwnerId", constraints: false })


// Middlewares
app.use(express.static(__dirname + "/public"));
app.use(session({
    secret: "1b15dc2f6bd549a483caaccdb5186f36",
    cookie: { maxAge: 1000 * 3600 * 24 * 7 },
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Custom Middlewares
const { loginRequired, logoutRequired } = require("./middlewares/middlewares.js");


// Routes
const routes = require('./routes/routes.js');

app.get("/", logoutRequired, routes.getHome);
app.get("/home", logoutRequired, routes.getHome);
app.get("/register", logoutRequired, routes.getRegister);
app.get("/login", logoutRequired, routes.getLogin)
app.post("/register", logoutRequired, routes.postRegister);
app.post("/login", logoutRequired, routes.postLogin);
app.get("/logout", routes.logout);
app.get("/dashboard", loginRequired, routes.getDashboard);
app.get("/create-link", loginRequired, routes.getCreateLink);
app.post("/create-link", loginRequired, routes.postCreateLink);
app.get("/account", loginRequired, routes.getAccountSettings);
app.get("/:username", routes.getUserProfile);
app.get("/edit/:linkId", loginRequired, routes.getEditLink);
app.post("/edit/:linkId", loginRequired, routes.postEditLink);
app.post("/delete/:linkId", loginRequired, routes.deleteLink);


const PORT = process.env.PORT || 5000;

db.sync({ alter: true }).then(
    () => {
        app.listen(PORT, () => { console.log(`Server started on port ${PORT}`) })
    }
)