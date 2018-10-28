'use strict';

const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/product');
const Order = require('../models/order');


router.get('/', function(req, res, next) {
  let successMsg = req.flash('success')[0];
  
  Product.find((err, docs) => {
    let productChunks = [];
    let chunkSize = 3;
    for (let i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    res.render('shop/index', 
      { 
        title: 'Shopping Cart', 
        products: productChunks, 
        successMsg: successMsg, 
        noMessages: !successMsg 
      });
  });
});

router.get('/add-to-cart/:id', (req, res, next) => {
 
  let productId = req.params.id;
  
  let cart = new Cart(req.session.cart ? req.session.cart : {});

  Product.findById(productId, (err, product) => {
    if (err) {
      return res.redirect('/'); 
    }
    cart.add(product, product.id);
    req.session.cart = cart;
    console.log(req.session.cart);
    res.redirect('/');
  });
});

router.get('/reduce/:id', (req, res, next) => {
  let productId = req.params.id;
  let cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
})

router.get('/remove/:id', (req, res, next) => {
  let productId = req.params.id;
  let cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
})

router.get('/shopping-cart', (req, res, next) => {
  if (!req.session.cart) {
    return res.render('shop/shopping-cart', {products: null});
  }
  let cart = new Cart(req.session.cart);
  res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
})

router.get('/checkout', isLoggedIn, (req, res, next) => {
  console.log('processing the get checkout...');

  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }

  console.log('req.session.cart: ', req.session.cart);

  let cart = new Cart(req.session.cart);
  let errMsg = req.flash('error')[0];
  res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noErrors: !errMsg})
})

router.post('/checkout', isLoggedIn, (req, res, next) => {
  console.log('processing the post checkout...');

  if (!req.session.cart) {
      return res.redirect('/shopping-cart');
  }
  let cart = new Cart(req.session.cart);
  
  console.log('created the cart...');

  console.log('token: ', req.body.stripeToken);
 
  let stripe = require("stripe")(
    "sk_test_l6yzGVoH7wUkz5F7vRrRlczU"
  )
  stripe.charges.create({
      amount: cart.totalPrice * 100,
      currency: "usd",
      source: req.body.stripeToken, 
      description: "Test Charge"
  }, (err, charge) => {
      if (err) {
          console.log('there were errors...');
          req.flash('error', err.message);
          return res.redirect('/checkout');
      }
      console.log("=============================================");
      console.log('req.user: ', req.user);
      console.log('cart: ', cart);
      console.log('address: ', req.body.address);
      console.log('name: ', req.body.name);
      console.log('paymentId: ', charge.id);

      let order = new Order({
          user: req.user,
          cart: cart,
          address: req.body.address,
          name: req.body.name,
          paymentId: charge.id
      });
      order.save(function(err, result) {
          
          req.flash('success', 'Successfully bought product!');
          req.session.cart = null;
          res.redirect('/');
      });

  }); 
});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  req.session.oldUrl = req.url; // 
  res.redirect('/user/signin');
}
