const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.indexRoute = async (req, res) => {
    const allListings =  await Listing.find({});
    res.render("listings/index.ejs", {allListings});
    }


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}


module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate: {path: "author"}}).populate("owner");

    if(!listing) {
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }

    console.log(listing);
    res.render("listings/show.ejs", {listing});
}


module.exports.createListing = async (req, res, next) => {

// using map forward geocoding service
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    })
    .send();

    let url = req.file.path;
    let filename = req.file.filename;
    
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};

    // for storing map coordinates in our database
    if(response.body.features && response.body.features.length > 0) {
        newListing.geometry = response.body.features[0].geometry;
    }

    let savedListing = await newListing.save();
        console.log(savedListing);
        req.flash("success", "New Listing Created !");
        res.redirect(`/listings`);
}


module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", {listing, originalImageUrl});
}


module.exports.updateListing = async (req, res) => {
    let {id} = req.params;
    // await Listing.findByIdAndUpdate(id, {...req.body.listing});
    
    const updated = await Listing.findByIdAndUpdate(id, req.body.listing, {new: true});
    if(!updated){
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }

    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;

        updated.image = {url, filename};
    }
    
    // Update geometry if location has changed
    let response = await geocodingClient.forwardGeocode({
        query: updated.location,
        limit: 1,
    })
    .send();

    if(response.body.features && response.body.features.length > 0) {
        updated.geometry = response.body.features[0].geometry;
    }

    await updated.save();

    req.flash("success", "Listing Updated !");

    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    let {id} = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    if(!deleteListing){
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }
    console.log("Deleted Listing: ", deleteListing);
    req.flash("success", "Listing Deleted !");
    res.redirect("/listings");
}