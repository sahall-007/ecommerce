



const checkSession = (req, res, next) => {
    if(req.session.user || req.session?.passport?.user){
        // console.log(req.session.user)
        // console.log(req.session?.passport?.user)
        // console.log("session exist")
        next()
    }
    else{
        // console.log("session does not exist")
        res.redirect('/login')
    }
}

const hasSession = (req, res, next) => {
    if(req.session.user || req.session?.passport?.user){
        // console.log("has session")
        res.redirect('/')
    }
    else{
        next()
    }
}

module.exports = {
    checkSession,
    hasSession
}