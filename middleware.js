const Listing = require("./models/listing");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema, reviewSchema} = require("./schema.js");

// [Server side validation jaruri hai nahi to koi bhi postman ya hoppscotch se unlimited acces bhej sakta hai] this is a validation for every field by joi tool (npm package)
    module.exports.validateListing = (req, res, next) => {
    // below line is because of joi npm who check validation error of every individual field
    let {error} = listingSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// [Server side validation for review by Joi npm package]
    module.exports.validateReview = (req, res, next) => {
    // below line is because of joi npm who check validation error of every individual field
    let {error} = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};


// Used this middleware in different routes to make it write once instead of writing this logic in every route for login
    module.exports.isLoggedIn = (req, res, next) => {
        // console.log(req.path, "..", req.originalUrl);
    if(!req.isAuthenticated()) {

        //post login redirectUrl save
        req.session.redirectUrl = req.originalUrl;   //lekin passport sessions ko reset karta hai login ke baad isliye locals me save karayenge taki jo humne save kiya hai vo delete na ho paye

        req.flash("error", "You must be logged in to create listing !");
        return res.redirect("/login");
    }
    next();
    }


//redirectUrl save karne ka logic using res.local which can be never deleted by sessions reset
    module.exports.saveRedirectUrl = (req, res, next) => {
        if(req.session.redirectUrl) {
            res.locals.redirectUrl = req.session.redirectUrl;
        }
        next();
    };


//check if the logined one is the owner of that particular listing or not
    module.exports.isOwner = async(req, res, next) => {
        let {id} = req.params;
        // await Listing.findByIdAndUpdate(id, {...req.body.listing});
        let listing = await Listing.findById(id);
        if(!listing.owner.equals(res.locals.currUser._id)) {
            req.flash("error", "You are not the owner of this listing");
            return res.redirect(`/listings/${id}`);
        }
        next();
    };

//check if the logined one is the owner of that particular listing or not
    module.exports.isReviewAuthor = async(req, res, next) => {
        let {id, reviewId} = req.params;
        // await Listing.findByIdAndUpdate(id, {...req.body.listing});
        let review = await Review.findById(reviewId);
        if(!review.author.equals(res.locals.currUser._id)) {
            req.flash("error", "You are not the author of this review");
            return res.redirect(`/listings/${id}`);
        }
        next();
    };
