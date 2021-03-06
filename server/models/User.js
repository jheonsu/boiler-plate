const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const { JsonWebTokenError } = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength : 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

userSchema.pre('save', function(next){
    let user = this;

    if(user.isModified('password')){

        //비밀번호 암호화 시키기
    bcrypt.genSalt(saltRounds, function(err,salt){
        if(err) return next(err)
        
        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err)
            user.password = hash
            next()
          })
     })
    } else{
        next()
    }
})

userSchema.methods.comparePassword = function(plainPassword, cb){

    //plainPassword를 암호화 한 후 DB의 암호화 된 password와 같은지 비교
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err);
        cb(null, isMatch);
    })
}

userSchema.methods.generateToken = function(cb){
    let user = this;
    //jsonwebtoken을 이용해서 token 생성
    let token = jwt.sign(user._id.toHexString(), 'secretToken')

   user.token = token
   user.save(function(err,user){
       if(err) return cb(err)
        cb(null, user)    
    })
}

userSchema.statics.findByToken = function(token, cb){
    let user = this;

    //user._id + '' = token;
    //토큰을 디코드 한다.
    jwt.verify(token, 'secretToken', function(err, decoded) {
        //유저 아이디를 이용하여 유저를 찾은 후 클라이언트와 DB의 토큰 비교
        user.findOne({"_id": decoded, "token": token}, function(err, user){
            if(err) return cb(err);
            cb(null, user)
        })
    })

}

const User = mongoose.model('User',userSchema)

module.exports = {User}