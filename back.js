require('dotenv').config();
const path=require('path');
const crypto=require('crypto');
const express=require('express');
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const helmet=require('helmet');
const cors=require('cors');
const rateLimit=require('express-rate-limit');
const app=express();
const PORT=process.env.PORT||10000;
const MONGODB_URI=process.env.MONGODB_URI;
const JWT_SECRET=process.env.JWT_SECRET;
const allowedOrigins=['https://korcz4k.github.io','https://kzsite.onrender.com'];
const corsOptions={origin(origin,callback){if(!origin||allowedOrigins.includes(origin))return callback(null,true);return callback(new Error('Origem não permitida pelo CORS.'));},methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization'],optionsSuccessStatus:204};
app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:false}));
app.use(cors(corsOptions));
app.options('*',cors(corsOptions));
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:false,limit:'1mb'}));
app.use(express.static(path.join(__dirname)));
const apiLimiter=rateLimit({windowMs:15*60*1000,max:100});
const authLimiter=rateLimit({windowMs:15*60*1000,max:20});
app.use('/api',apiLimiter);
const quoteSchema=new mongoose.Schema({quoteId:{type:String,required:true,unique:true,match:/^\d{15}$/},user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},nomeProponente:{type:String,required:true,trim:true},email:{type:String,required:true,trim:true,lowercase:true},telefone:String,descricao:String,quemAtendeu:{type:String,default:'Pendente'},empresaProjeto:String,tipoOrcamento:String,status:{type:String,enum:['novo','em_analise','respondido','arquivado'],default:'novo'}},{timestamps:true});
const userSchema=new mongoose.Schema({nome:{type:String,required:true,trim:true},sobrenome:{type:String,required:true,trim:true},userId:{type:String,required:true,unique:true,match:/^\d{9}$/,select:false},telefone:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,trim:true,lowercase:true},passwordHash:{type:String,required:true,select:false},role:{type:String,enum:['admin','cliente'],default:'cliente'},verified:{type:Boolean,default:false},lastLoginAt:Date},{timestamps:true});
const Quote=mongoose.model('Quote',quoteSchema);
const User=mongoose.model('User',userSchema);
function makeToken(user){return jwt.sign({sub:user._id.toString(),role:user.role},JWT_SECRET,{expiresIn:'7d'});}
async function generateUserId(){for(let i=0;i<30;i++){const id=String(crypto.randomInt(100000000,1000000000));if(!(await User.exists({userId:id})))return id;}throw Error('Falha ao gerar ID interno');}
async function generateQuoteId(){for(let i=0;i<30;i++){const id=Array.from({length:15},()=>crypto.randomInt(0,10)).join('');if(!(await Quote.exists({quoteId:id})))return id;}throw Error('Falha ao gerar ID de orçamento');}
function auth(){return async(req,res,next)=>{try{const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token)return res.status(401).json({error:'Faça login para continuar.'});const payload=jwt.verify(token,JWT_SECRET);const user=await User.findById(payload.sub);if(!user)return res.status(401).json({error:'Sessão inválida.'});req.user=user;next();}catch{return res.status(401).json({error:'Sessão inválida ou expirada.'});}}}
app.get('/health',(req,res)=>res.json({status:'ok',database:mongoose.connection.readyState===1?'connected':'disconnected'}));
app.post('/api/auth/register',authLimiter,async(req,res)=>{try{const{nome,sobrenome,telefone,email,senha}=req.body;if(!nome?.trim()||!sobrenome?.trim()||!telefone?.trim()||!email?.trim()||!senha)return res.status(400).json({error:'Preencha todos os campos.'});if(senha.length<8)return res.status(400).json({error:'A senha deve ter pelo menos 8 caracteres.'});if(await User.exists({email:email.toLowerCase()}))return res.status(409).json({error:'Este e-mail já está cadastrado.'});const userId=await generateUserId();const passwordHash=await bcrypt.hash(senha,12);const firstUser=await User.countDocuments()===0;const user=await User.create({nome,sobrenome,telefone,email,passwordHash,userId,role:firstUser?'admin':'cliente'});res.status(201).json({message:'Conta criada.',token:makeToken(user),user:{id:user._id,nome:user.nome,sobrenome:user.sobrenome,email:user.email,role:user.role}});}catch(error){console.error(error);res.status(500).json({error:'Não foi possível criar a conta.'});}});
app.post('/api/auth/login',authLimiter,async(req,res)=>{try{const{email,senha}=req.body;const user=await User.findOne({email:String(email||'').trim().toLowerCase()}).select('+passwordHash');if(!user||!(await bcrypt.compare(String(senha||''),user.passwordHash)))return res.status(401).json({error:'E-mail ou senha inválidos.'});user.lastLoginAt=new Date();await user.save();res.json({message:'Login realizado.',token:makeToken(user),user:{id:user._id,nome:user.nome,sobrenome:user.sobrenome,email:user.email,role:user.role}});}catch(error){console.error(error);res.status(500).json({error:'Não foi possível realizar o login.'});}});
app.post('/api/quotes',auth(),async(req,res)=>{try{const{empresa,servico,projeto}=req.body;if(!empresa?.trim()||!servico?.trim()||!projeto?.trim())return res.status(400).json({error:'Preencha empresa ou projeto, serviço e descrição.'});const quoteId=await generateQuoteId();const quote=await Quote.create({quoteId,user:req.user._id,nomeProponente:`${req.user.nome} ${req.user.sobrenome}`,email:req.user.email,telefone:req.user.telefone,descricao:projeto,empresaProjeto:empresa,tipoOrcamento:servico});res.status(201).json({message:'Orçamento recebido.',quoteId:quote.quoteId,quemAtendeu:'Pendente'});}catch(error){console.error(error);res.status(500).json({error:'Não foi possível registrar o orçamento.'});}});
app.get('/api/me',auth(),async(req,res)=>{const quotes=await Quote.find({user:req.user._id}).sort({createdAt:-1}).select('quoteId status quemAtendeu empresaProjeto tipoOrcamento createdAt');res.json({user:{nome:req.user.nome,sobrenome:req.user.sobrenome,email:req.user.email,telefone:req.user.telefone,role:req.user.role},quotes});});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
async function start(){if(!MONGODB_URI)throw Error('Defina MONGODB_URI no Render.');if(!JWT_SECRET)throw Error('Defina JWT_SECRET no Render.');await mongoose.connect(MONGODB_URI,{dbName:'KorczakTechSite'});console.log('MongoDB conectado');app.listen(PORT,'0.0.0.0',()=>console.log(`Servidor na porta ${PORT}`));}
start().catch(error=>{console.error('startup_error',error);process.exit(1);});