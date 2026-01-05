//to access environmental variables of 3rd party we use npm package .env
if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}


//basic requirements what all we needed are required here
const express = require("express");
const app = express();
const mongoose = require("mongoose");
//for setting ejs we require following
const path = require("path");
const methodOverride = require("method-override"); //jugad of form submission other than get and post
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");  //for setting up passport
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const wrapAsync = require("./utils/wrapAsync.js");

mongoose.set("strictQuery", true); // OR false (your choice) // for removing warnings

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    // await mongoose.connect(dbUrl);
    await mongoose.connect(MONGO_URL);
}


//middlewares for connecting a path for views folder where we be going to write ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
//setting ejs mate as our engine
app.engine("ejs", ejsMate);
//middleware to parse the data as we are requisting the data from body or parameters
app.use(express.urlencoded({extended: true}));
//middleware for method override
app.use(methodOverride("_method"));
//middleware for static files like css,js etc
app.use(express.static(path.join(__dirname, "public")));

// mongo store to save sessions of user
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600, //time period in seconds //for lazy update
});

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

//expression session
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 1000,
        httpOnly: true,
    },
};



app.use(session(sessionOptions));   //session is also require for passport
app.use(flash()); //routes ke pehale initialize karo

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//flash middleware
    app.use((req, res, next) => {
        res.locals.success = req.flash("success");
        // console.log(res.locals.success);
        res.locals.error = req.flash("error");
        res.locals.currUser = req.user;  //we write this line of code cause we where not able to access "req.user" in navbar.ejs
        next();
    });


//Router Object ka use
    // Router object ke through use karre hai listings ke sare routes
    app.use("/listings", listingRouter);
    // Router object ke through use karre hai reviews ke sare routes
    app.use("/listings/:id/reviews", reviewRouter);
    // Router object for user signup
    app.use("/", userRouter);

    app.get("/", (req, res) => {
        res.redirect("/listings"); 
    });



// For all other wrong route which are not defined
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found !"))
});


// Custom Error Handling
app.use((err, req, res, next) => {
    let {statusCode = 500, message = "Something went Wrong !"} = err;
    res.status(statusCode).render("Error.ejs", {message});
    // res.status(statusCode).send(message);
});


app.listen(8080, () => {
    console.log("server is listening to port 8080");
});