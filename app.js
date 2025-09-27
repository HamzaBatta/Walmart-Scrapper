const express = require('express');
const app = express();

const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const methodOverride = require('method-override');

//middleware for method override
app.use(methodOverride('_method'));
//Requiring user and admin routes
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

//requiring user model
const User = require('./models/userModel');


dotenv.config({ path: './config.env' });

mongoose.connect(process.env.DATABASE_LOCAL, {
});

//middleware for session
app.use(session({
    secret : 'just a simple login and signup application',
    resave : true,
    saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy({ usernameField:'email' } ,User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware for flash messages
app.use(flash());

//settings middleware globally
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(userRoutes);
app.use(adminRoutes);
app.use(express.static('public'));

app.listen(process.env.PORT, () => {
    console.log('Server is running on port', process.env.PORT);
});
