const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const async = require('async');
const nodemailer = require('nodemailer');
//requiring user model
const User = require('../models/userModel');

//Check if user is authenticated
function isAuthenticated (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error_msg', 'Please login to view this page');
    res.redirect('/login');
}

//Get Routes
router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/login', (req, res) => {
    res.render('./users/login');
});

router.get('/signup',isAuthenticated, (req, res) => {
    res.render('./users/signup');
});

router.get('/dashboard', isAuthenticated,(req, res) => {
    res.render('./users/dashboard');
});

router.get('/logout', isAuthenticated, (req, res) => {
    req.logout((err)=> {
        req.flash('success_msg', 'You are logged out');
        res.redirect('/login');
    })
});

router.get('/forgot', (req,res) =>{
    res.render('./users/forgot');
});

router.get('/reset/:token', (req, res) => {
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    }).then(user => {
        if(!user){
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            res.redirect('/forgot');
        }
        res.render('./users/newpassword', {token: req.params.token});
    }).catch(err => {
        req.flash('error_msg', 'Error: ' + err.message);
        res.redirect('/forgot');
    })
});

router.get('/password/change', isAuthenticated , (req, res) => {
    res.render('./users/changepassword');
})

router.get('/users/all',isAuthenticated, (req,res) => {
    User.find({}).then(users =>{
        res.render('./users/allusers', {users: users})
    })
    .catch(err => {
        console.log(err);
    })
})

router.get('/edit/:id',isAuthenticated, (req,res) => {
    let searchQuery = {_id : req.params.id}

    User.findOne(searchQuery)
    .then (user => {
        res.render('./users/edituser', {user:user});
    })
    .catch(err => {
        req.flash('error_msg', 'Error: '+ err.message);
        req.redirect('/users/all');
    })
    

})

//Post Routes
router.post('/login', passport.authenticate('local',{
    successRedirect : '/dashboard',
    failureRedirect : '/login',
    failureFlash : 'Invalid email or password, Try again!'
}))


router.post('/signup',isAuthenticated,(req,res) => {
    let {name,email,password} = req.body;

    let userData = {
        name: name,
        email: email,

    };
    User.register(userData,password, (err,user)=>{
        if(err){
            req.flash('error_msg', 'Error: '+err.message);
            res.redirect('/signup');
        }
        req.flash('success_msg', 'account created successfully');
        res.redirect('/signup');
    })
});

router.post('/password/change', (req,res) => {
    if(req.body.password !== req.body.confirmpassword){
        req.flash('error_msg', 'Passwords do not match.');
        return res.redirect('/password/change');
    }
    User.findOne({email: req.user.email}).then(user => {
        user.setPassword(req.body.password, err =>{
            user.save().then( user => {
                req.flash('success_msg', 'Password changed successfully');
                res.redirect('/password/change');
            }).catch( err => {
                req.flash('error_msg', 'Error: '+ err.message);
                res.redirect('/password/change');
            });
        });
    });
});

router.post('/forgot', (req, res) => {
    async.waterfall([
        (done) => {
            crypto.randomBytes(20, (err, buf) => {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) => {
            User.findOne({email: req.body.email }).then(user => {
                if (!user) {
                    req.flash('error_msg', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                user.save().then(() => {
                    done(null, token, user);
                }).catch(err => {
                    done(err);
                });
            }).catch(err => {
                done(err);
            });
        },
        (token, user, done) => {
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.GMAIL_EMAIL,
                    pass: process.env.GMAIL_PASSWORD
                }
            });
            let mailOptions = {
                to: user.email,
                from: `Hamza Batta <${process.env.GMAIL_EMAIL}>`,
                subject: 'Password Reset',
                text: 'please click on the following link to recover your password \n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                if (err) {
                    req.flash('error_msg', 'Error sending email: ' + err.message);
                    return res.redirect('/forgot');
                }
                req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                res.redirect('/forgot');
            });
        }
    ], function (err) {
        if (err) {
            req.flash('error_msg', 'Error: ' + err.message);
            res.redirect('/forgot');
        }
    });
});

router.post('/reset/:token', (req, res) => {
    async.waterfall([
        (done) => {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }})
                .then(user => {
                    if(!user){
                        req.flash('error_msg', 'Password reset token is invalid or has expired.');
                        res.redirect('/forgot');
                    }

                    if(req.body.password !==req.body.confirmpassword){
                        req.flash('error_msg', 'Passwords do not match.');
                        res.redirect('/forgot');
                    }

                    user.setPassword(req.body.password, err => {
                        user.resetPasswordExpires = undefined;
                        user.resetPasswordToken = undefined;
                        user.save().then( () => {
                            req.login(user, err => {
                                done(err, user);
                            })
                        });
                    });
                }).catch(err => {
                    req.flash('error_msg', 'Error: ' + err.message);
                    res.redirect('/forgot');
                });
        },
        (user) => {
             let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.GMAIL_EMAIL,
                    pass: process.env.GMAIL_PASSWORD
                }
            });
            let mailOptions = {
                to: user.email,
                from: `Hamza Batta <${process.env.GMAIL_EMAIL}>`,
                subject: 'Password Changed',
                text: 'Hello, ' +user.name + '\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };

            smtpTransport.sendMail(mailOptions, (err) => {
                if (err) {
                    req.flash('error_msg', 'Error sending email: ' + err.message);
                    return res.redirect('/forgot');
                }
                req.flash('success_msg', 'Your password has been changed successfully. ');
                res.redirect('/login');
            });
        }
    ]), err => {
        res.redirect('/login');
    }
})

//Put routes
router.put('/edit/:id', (req,res) => {
    let searchQuery = {_id : req.params.id}
    User.updateOne(searchQuery,{$set : {
        name : req.body.name,
        email : req.body.email
    }})
    .then (user => {
        req.flash('success_msg', 'User updated successfully');
        res.redirect('/users/all');
    })
    .catch(err => {
        req.flash('error_msg', 'Error: '+ err.message);
        req.redirect('/users/all');
    });
});


//delete routes
router.delete('delete/user/:id', (req,res) => {
    searchQuery = {_id : req.params.id}

    User.deleteOne(searchQuery)
        .then(user => {
            req.flash('success_msg', 'User deleted successfully');
            res.redirect('/users/all');
        })
        .catch(err => {
            req.flash('error_msg', 'Error: '+ err.message);
            req.redirect('/users/all');
        });
});

module.exports = router;