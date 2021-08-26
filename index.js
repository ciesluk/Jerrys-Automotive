//index.js
//Revision History
//    Tom Cieslukowski, 2021.08.04: Created

//import dependencies 
const express = require('express');
const path = require('path');

//Set up express validator
const {check, validationResult} = require('express-validator');

//Set up database 
const mongoose = require('mongoose');
mongoose.connect('mongodb://(Enter your host here)/jerrysautomotive', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}) 

//define the collection, set up the model for the order
const Order = mongoose.model('Order', {
    customerName: String,
    customerAddress: String,
    customerCity: String,
    customerPostal: String,
    customerProvince: String,
    customerPhone: String,
    customerEmail: String,
    shipDays: String,
    tireItem: Number,
    mufflerItem: Number,
    tireCost: Number,
    mufflerCost: Number,
    subTotal: Number,
    tax: Number,
    total: Number
});  

var myApp = express();

//set up variables to use packages
myApp.use(express.urlencoded({extended: false}));

myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs'); 

//Regular Expressions
var phoneRegex = /^[0-9]{3}\-[0-9]{3}\-[0-9]{4}$/;
var emailRegex =/^[a-zA-z0-9\.]{1,}\@[a-zA-z0-9\-]{1,}\.[a-zA-Z]{2,3}$/;
var itemQuantityRegex = /^[0-9]{1,}$/;
var postalRegex = /^[A-Z][0-9][A-Z]\s[0-9][A-Z][0-9]$/;

//render the home page
myApp.get('/', function(req, res){
    res.render('store');
});

myApp.post('/process', [
    check('customerName', '*Please enter a name*').not().isEmpty(),
    check('customerAddress', '*Please enter an address*').not().isEmpty(),
    check('customerCity', '*Please enter a city*').not().isEmpty(),
    check('customerProvince', '*Please enter a province in specific format. Ex. Ontario*').not().isEmpty(),
    check('customerPhone', '*Please enter a valid phone number in format: XXX-XXX-XXXX*').matches(phoneRegex),
    check('customerEmail', '*Please enter a valid email in format: sample@email.com*').matches(emailRegex),
    check('customerPostal','*Please enter a postal code in format X9X 9X9*').matches(postalRegex),
    check('tireItem', '*Please enter a valid number for tire quantity*').matches(itemQuantityRegex),
    check('mufflerItem', '*Please enter a valid number for muffler quantity*').matches(itemQuantityRegex)
], function(req, res){
    //check for errors
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        res.render('store', {
            errors: errors.array()
        })
    }
    else{
        //fetch all the form fields
        var customerName = req.body.customerName;
        var customerAddress = req.body.customerAddress;
        var customerCity = req.body.customerCity;
        var customerPostal = req.body.customerPostal;
        var customerProvince = req.body.customerProvince;
        var customerPhone = req.body.customerPhone;
        var customerEmail = req.body.customerEmail;
        var shipDays = req.body.shipDays;
        var tireItem = req.body.tireItem;
        var mufflerItem = req.body.mufflerItem;

        var tireCost = tireItem * 20;
        var mufflerCost = mufflerItem * 68;
        //Calculate subtotal of all the items
        var subTotal = tireCost + mufflerCost;

        if(shipDays == 1){
            subTotal += 10;
        }else if(shipDays == 2){
            subTotal += 20;
        }else{
            subTotal += 30;
        }

        //Calculate tax
        var tax = subTotal * 0.13;

        //Calculate total
        var total = subTotal + tax;

        var pageData = {
            customerName: customerName,
            customerAddress: customerAddress,
            customerCity: customerCity,
            customerPostal: customerPostal,
            customerProvince: customerProvince,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            shipDays: shipDays,
            tireItem: tireItem,
            mufflerItem: mufflerItem,
            tireCost: tireCost,
            mufflerCost: mufflerCost,
            subTotal: subTotal,
            tax: tax,
            total: total
        }
        
        //create an object for the model order
        var myOrder = new Order(pageData);

        //save the order
        myOrder.save().then(function(){
            console.log('New Order created');
        });  

        //send the data to the view and we will render it
        res.render('receipt', pageData);
    }
});

//render the complete orders page, which will retrieve data from the database
myApp.get('/completeOrders', function(req,res){
    Order.find({}).exec(function(err, orders){
        console.log(err);
        res.render('completeOrders', {orders: orders})
    })
});

myApp.listen(8080);
console.log('Everything executed fine...website at port 8080...')

