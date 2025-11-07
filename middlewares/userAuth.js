



const checkSession = (req, res, next) => {
    if(req.session.user || req.session.passport){
        console.log("session exist")
        next()
    }
    else{
        console.log("session does not exist")
        res.redirect('/login')
    }
}

const hasSession = (req, res, next) => {
    if(req.session.user || req.session.passport){
        // console.log("has session")
        res.redirect('/home')
    }
    else{
        next()
    }
}

module.exports = {
    checkSession,
    hasSession
}