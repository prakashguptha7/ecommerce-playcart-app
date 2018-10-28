'use strict';

const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/order');
const Cart = require('../models/cart');

const csrf = require('csurf');
const csrfProtection = csrf();

const passport = require('passport');

router.use(csrfProtection); 

const HOST_IP = 'http://localhost:3000';
console.log(HOST_IP);
 
router.get('/profile', isLoggedIn, (req, res, next) => {
  Order.find({user: req.user}, (err, orders) => {
    if (err) {
      return res.write('Error!');
    }
    let cart;
    orders.forEach((order) => {
      cart = new Cart(order.cart);
      order.items = cart.generateArray();
    });
    res.render('user/profile', { orders: orders });
  });
});


router.get('/logout', isLoggedIn, (req, res, next) => {
  req.logout();
  res.redirect('/');
});


router.use('/', notLoggedIn, (req, res, next) => {  
  next();
});


router.get('/signup', (req, res, next) => {
  let messages = req.flash('error');
  res.render('user/signup', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
})


router.post('/signup', passport.authenticate('local.signup', {
  failureRedirect: '/user/signup',
  failureFlash: true
}), (req, res, next) => {
  if (req.session.oldUrl) {
    
    let oldUrl = req.session.oldUrl;
    req.session.oldUrl = null;
   
    res.redirect(oldUrl);
  } else {
    res.redirect('/user/profile');
  }
});


router.get('/signin', (req, res, next) => {
  let messages = req.flash('error');
  res.render('user/signin', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});


router.post('/signin', passport.authenticate('local.signin', {
  failureRedirect: '/user/signin',
  failureFlash: true
}), (req, res, next) => {
  if (req.session.oldUrl) {
    let oldUrl = req.session.oldUrl;
    req.session.oldUrl = null;
    res.redirect(oldUrl);
  } else {
    res.redirect('/user/profile');
  }
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect(`/`);
}

function notLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
      return next();
  }
  res.redirect(`${HOST_IP}/`);
}