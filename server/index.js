const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser');
const config = require('./config/key');
const cookieParser = require('cookie-parser');
const  { User } = require("./models/User");
const {auth} = require("./middleware/auth");

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

//application/json
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require ('mongoose')
mongoose.connect(config.mongoURI)
.then( () => console.log('MongoDB Connected...'))
.catch(err=> console.log(err))

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/api/users/register', (req, res) =>{
  //회원 가입시 필요한 정보들을 client에서 가져오면
  //그것들을 database에 넣어준다.
  const user = new User(req.body)

  user.save((err, userInfo) =>{
    if(err) return res.json({ success: false, err})
    return res.status(200).json({
      success: true
    })
  })
})

app.post('/api/users/login', (req,res) =>{
  //요청된 이메일을 데이터베이스에 있는지 찾는다.
  User.findOne({email: req.body.email}, (err, user) => {
    if(!user){
      return res.json({
        loginSuccess: false,
        message: "존재하지 않는 이메일입니다."
      })
    }
    
    //데이터베이스에 있다면 비밀번호가 같은지 확인한다.
    user.comparePassword(req.body.password, (err, isMatch) => {
      if(!isMatch)
      return res.json({ loginSuccess: false, message: "비밀번호가 틀립니다."})

      
    //비밀번호까지 같다면 토큰 생성
      user.generateToken((err,user) => {
        if(err) return res.status(400).send(err);

        // token을 쿠키 혹은 로컬 스토리지 등에 저장한다.
          res.cookie("x_auth", user.token)
          .status(200)
          .json({loginSuccess: true, userId: user._id})
  
      })
    })

  })

})

app.get('/api/users/auth', auth , (req, res) =>{

  //여기까지 middleware를 통과했으면 Authentication이 true라는 말
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true, //role이 0이 아니면 관리자
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image
  })
})

app.get('/api/users/logout', auth, (req, res) => {
  User.findOneAndUpdate({_id: req.user._id},
    {token: ""},
    (err, user) => {
            if(err) return res.json({success: false, err});
      return res.status(200).send({
            success: true
       })
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})