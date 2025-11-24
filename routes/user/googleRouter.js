const express = require('express')
const middleware = require('../../middlewares/userAuth.js')
const passport = require('passport');
const userSchema = require('../../model/userSchema.js');

const router = express.Router()

router.route('/auth/google')
    .get(passport.authenticate('google', {scope: ['profile', 'email']}))

router.route('/auth/google/callback')
    .get(passport.authenticate('google', {failureRedirect: '/register'}), async (req, res) => {

        const user = await userSchema.findOne({_id: req.session.passport.user})
        if(user.isListed==false){
            return res.redirect('/')
        }
        res.redirect('/')
    })

module.exports = router