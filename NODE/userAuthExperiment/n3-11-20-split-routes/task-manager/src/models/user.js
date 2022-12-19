import bcryptjs from 'bcryptjs'
import { model, Schema } from 'mongoose'
import validator from 'validator'
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique:true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    tokens:[{
        token:{
            type: String,
            required: true
        }
    }]
})

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id:user._id.toString()},'thisismynewcourse',{ expiresIn:'2 days' })

    user.tokens = user.tokens.concat({ token })
    await user.save()
    
    return token
}

userSchema.statics.findByCredentials = async (email,password) =>{
    const user = await User.findOne({email})

    if(!user){
        throw new Error("Unable to login")
    }

    const isMatch = await bcryptjs.compare(password,user.password)

    if (!isMatch){
        throw new Error("Unable to login")
    }

    return user
}
//!
//Hash the plain text pass before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')){
        user.password = await bcryptjs.hash(user.password,8)
    }

    return next()
})

//!

const User = model('User', userSchema)

export default User