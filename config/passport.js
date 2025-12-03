
const passport = require('passport')
const rndm = require('rndm')
const googleStrategy = require('passport-google-oauth20').Strategy
const userSchema = require('../model/userSchema.js')
const env = require('dotenv').config()

const logger = require('./pinoLogger.js')


passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
    passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
    try{
        let googleUser = await userSchema.findOne({googleId: profile.id})

        // if(googleUser.isListed==false){
            
        // }
        var referral = rndm.base62(10)
        
        if(googleUser){
            // req.session.user = googleUser._id
            logger.info("this is google login")
            return done(null, googleUser)
        }
        else{
            googleUser =  new userSchema({
                username: profile.displayName,
                email: profile.emails[0].value,                
                googleId: profile.id,
                isListed: true,
                referral
            });
            await googleUser.save()

            logger.info("this is google register")
            // req.session.user = googleUser._id
            return done(null, googleUser)
        }
    }
    catch(err){
        return done(err, null)
    }
}
));

passport.serializeUser((googleUser, done) => {
     done(null, googleUser._id)
});

passport.deserializeUser((id, done) => {
    userSchema.findById(id)
    .then(googleUser => {
        done(null, googleUser)
    })
    .catch(err =>{
        done(err, null)
    })
})

module.exports = passport;