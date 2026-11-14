'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const {fromBuffer} = require('file-type');
const {db, sql} = require('./db');
const app = express();
const port = Number(process.env.PORT || 3000);
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw Error('Set a strong JWT_SECRET in .env');
const prod = process.env.NODE_ENV === 'production';
const siteDir = path.resolve(__dirname, process.env.SITE_DIR || '../MadhaArtsScienceWebSite');
const uploadsDir = path.resolve(__dirname,'uploads');
fs.mkdirSync(uploadsDir,{recursive:true});
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'30kb'}));
app.use(cookieParser());
// Requests that change data must originate from this website (CSRF protection).
app.use('/api', (req,res,next) => {
  if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    const origin = req.get('Origin');
    const expected = `${req.protocol}://${req.get('host')}`;
    if (origin && origin !== expected) return res.status(403).json({error:'Origin mismatch'});
    if (!origin && req.get('Sec-Fetch-Site') === 'cross-site') return res.status(403).json({error:'Cross-site request refused'});
  }
  next();
});
const asyncHandler = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const auth = (req,res,next) => {
  try {
    const payload = jwt.verify(req.cookies.madha_admin,process.env.JWT_SECRET,{algorithms:['HS256']});
    req.adminId=Number(payload.sub);
    next();
  } catch { res.status(401).json({error:'Please sign in'}); }
};
const cookieOptions = {httpOnly:true, secure:prod, sameSite:'strict', path:'/api', maxAge:8*60*60*1000};
app.post('/api/admin/login',rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false}),asyncHandler(async (req,res) => {
  const username = String(req.body.username||'').trim().toLowerCase();
  const password = String(req.body.password||'');
  const result = await (await db()).request().input('username',sql.NVarChar(120),username)
    .query('SELECT TOP 1 Id, PasswordHash FROM dbo.AdminUsers WHERE Username=@username AND IsActive=1');
  const user = result.recordset[0];
  if (!user || !(await bcrypt.compare(password,user.PasswordHash))) return res.status(401).json({error:'Incorrect username or password'});
  const token=jwt.sign({},process.env.JWT_SECRET,{subject:String(user.Id),expiresIn:'8h',algorithm:'HS256'});
  res.cookie('madha_admin',token,cookieOptions).json({ok:true});
}));
app.post('/api/admin/logout',(req,res)=>res.clearCookie('madha_admin',{...cookieOptions,maxAge:undefined}).json({ok:true}));
app.get('/api/admin/me',auth,(req,res)=>res.json({ok:true}));
app.get('/api/updates',asyncHandler(async(req,res)=>{
  const result = await (await db()).request().query(`SELECT TOP (30)
Id, Type, Title, Summary, Department, EventDate, ImagePath, CreatedAt FROM dbo.NewsEvents WHERE Published=1 ORDER BY CreatedAt DESC`);
  res.set('Cache-Control','public, max-age=30');
  res.json(result.recordset);
}));

/* GET SINGLE PUBLISHED NEWS OR EVENT */

app.get('/api/updates/:id', asyncHandler(async (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({
            error: 'Invalid post ID'
        });
    }

    const result = await (await db())
        .request()
        .input('id', sql.Int, id)
        .query(`
            SELECT
                Id,
                Type,
                Title,
                Summary,
                Department,
                EventDate,
                ImagePath,
                CreatedAt
            FROM dbo.NewsEvents
            WHERE Id = @id AND Published = 1
        `);

    const post = result.recordset[0];

    if (!post) {
        return res.status(404).json({
            error: 'Post not found'
        });
    }

    res.set('Cache-Control', 'no-store');
    res.json(post);
}));

app.get('/api/admin/updates',auth,asyncHandler(async(req,res)=>{
  const result = await (await db()).request().query('SELECT TOP (200) Id,Type,Title,Summary,EventDate,ImagePath,Published,CreatedAt FROM dbo.NewsEvents ORDER BY CreatedAt DESC');
  res.json(result.recordset);
}));
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>{
  if (!['image/jpeg','image/png','image/webp'].includes(file.mimetype)) return cb(new Error('Use JPG, PNG or WebP image'));
  cb(null,true);
}});
function validatePost(body){
  const type=String(body.type||''); const title=String(body.title||'').trim(); const summary=String(body.summary||'').trim();
  const date=String(body.eventDate||'').trim(); const published=String(body.published)==='true';
  if (!['news','event'].includes(type)||!title||title.length>180||!summary||summary.length>800) throw Object.assign(Error('Please enter a type, title (max 180) and summary (max 800)'),{status:400});
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Object.assign(Error('Invalid event date'),{status:400});
 
const allowedDepartments = [
  "General",
  "Commerce",
  "Business Administration",
  "Computer Applications",
  "Computer Science",
  "Biotechnology",
  "Mathematics",
  "English",
  "Hotel & Catering Management"
];

const department = String(
  body.department || "General"
).trim();

if (!allowedDepartments.includes(department)) {
  throw Object.assign(
    new Error("Please select a valid department"),
    { status: 400 }
  );
}

return {
  type,
  title,
  summary,
  department,
  eventDate: date || null,
  published
};

}
async function saveImage(file){
  if(!file) return null;
  const actual=await fromBuffer(file.buffer);
  const allowed={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  if(!actual||!allowed[actual.mime]) throw Object.assign(Error('Uploaded file is not a supported image'),{status:400});
  const filename=crypto.randomUUID()+'.'+allowed[actual.mime];
  fs.writeFileSync(path.join(uploadsDir,filename),file.buffer,{flag:'wx'});
  return '/uploads/'+filename;
}
app.post('/api/admin/updates',auth,upload.single('image'),asyncHandler(async(req,res)=>{
  const post=validatePost(req.body);
  const imagePath=await saveImage(req.file);
 
const result = await (await db())
  .request()
  .input('type', sql.NVarChar(10), post.type)
  .input('title', sql.NVarChar(180), post.title)
  .input('summary', sql.NVarChar(800), post.summary)
  .input('department', sql.NVarChar(100), post.department)
  .input('eventDate', sql.Date, post.eventDate)
  .input('imagePath', sql.NVarChar(400), imagePath)
  .input('published', sql.Bit, post.published)
  .query(`
    INSERT INTO dbo.NewsEvents
    (
      Type,
      Title,
      Summary,
      Department,
      EventDate,
      ImagePath,
      Published
    )
    OUTPUT INSERTED.Id
    VALUES
    (
      @type,
      @title,
      @summary,
      @department,
      @eventDate,
      @imagePath,
      @published
    )
  `);

  res.status(201).json({id:result.recordset[0].Id});
}));
app.patch('/api/admin/updates/:id',auth,asyncHandler(async(req,res)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1||typeof req.body.published!=='boolean') return res.status(400).json({error:'Invalid post or status'});
  const result=await (await db()).request().input('id',sql.Int,id).input('published',sql.Bit,req.body.published)
    .query('UPDATE dbo.NewsEvents SET Published=@published,UpdatedAt=SYSUTCDATETIME() WHERE Id=@id');
  if(!result.rowsAffected[0]) return res.status(404).json({error:'Not found'});
  res.json({ok:true});
}));
app.delete('/api/admin/updates/:id',auth,asyncHandler(async(req,res)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:'Invalid post'});
  const result=await (await db()).request().input('id',sql.Int,id).query('DELETE FROM dbo.NewsEvents WHERE Id=@id');
  if(!result.rowsAffected[0])return res.status(404).json({error:'Not found'});
  res.json({ok:true});
}));
app.use('/uploads',express.static(uploadsDir,{dotfiles:'deny',index:false,maxAge:'1d'}));
// Serve only the existing website directory, not backend scripts or .env.
app.use(express.static(siteDir,{dotfiles:'deny',index:'index.html',extensions:['html']}));
app.use((err,req,res,next)=>{
  console.error(err);
  if(err instanceof multer.MulterError)return res.status(400).json({error:err.message});
  res.status(err.status||500).json({error:err.status?err.message:'Server error. Check backend logs.'});
});
app.listen(port,()=>console.log(`Madha website + API: http://localhost:${port} (site folder: ${siteDir})`));
