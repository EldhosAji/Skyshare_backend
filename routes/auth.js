const router = require('express').Router();
const User = require('../db/User');
const { registerValidation, loginValidation } = require('./validation')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

router.post('/register', async(req, res) => {
    //validation

    console.log("Auth registration")
    const { error } = registerValidation(req.body)
    if (error) {
        return res.status(403).send(error);
    }
    //user existing or not
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(402).send('Email already exists')

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    //submitting data
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    });
    try {
        const saveUser = await user.save();
        res.send(saveUser)
    } catch (err) {
        res.status(404).send(err)
    }

})

router.post('/login', async(req, res) => {

    const { error } = loginValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message);

    console.log(req.body)

    //user existing or not
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password')

    //validate password
    const valid = await bcrypt.compare(req.body.password, user.password)
    if (!valid) return res.status(400).send('Invalid email or password')
        //jwt token
    try {
        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_PASS)

        res.end(JSON.stringify({ 'authToken': token }))
    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = router;