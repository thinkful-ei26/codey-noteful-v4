const express = require('express');
const User = require('../models/user');
const router = express.Router();

// Post/Create new user //
router.post('/', (req, res, next) => {
    const {username, password, fullname} = req.body;
    const requiredFields = ['username', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));
    if(missingField) {
        const err = new Error(`Missing '${missingField}' in request body`);
        err.status = 422;
        return next(err);
    }
    if(typeof username !== 'string' || typeof password !== 'string'){
        const err = new Error(`Request body needs to be of type String.`);
            err.status = 422;
            return next(err);
    }
    if(/\s/.test(username) || /\s/.test(password)) {
        const err = new Error(`User and password must not contain spaces.`);
            err.status = 422;
            return next(err);
    }
    if(username.length < 1) {
        const err = new Error('Username must be at least 1 character.');
        err.status = 422;
        return next(err);
    }
    if(password.length < 8 || password.length > 72) {
        const err = new Error('Password must be between 8 and 72 characters.');
        err.status = 422;
        return next(err);
    }
    return User.hashPassword(password)
        .then(digest => {
            const newUser = {
                username,
                password: digest,
                fullname
            };
            return User.create(newUser);
        })
        .then(results => {
            return res.status(201).location(`/api/users/${results.id}`).json(results);
        })
        .catch(err => {
            if (err.code === 11000) {
                err = new Error('The username already exists');
                err.status = 400;
            }
            next(err);
        });
});

module.exports = router;