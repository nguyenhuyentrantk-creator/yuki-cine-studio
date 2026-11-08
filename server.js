import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const app = express();
const PORT = Number(process.env.PORT || 10000);
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 40);
const ORIGIN_LIST = (process.env.CORS_ORIGIN || "https://nguyenhuyentrank-creator.github.io")
  .split(",").map(x => x.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || ORIGIN_LIST.includes("*") || ORIGIN_LIST.includes(origin)) return cb(null, true);
    return cb(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"]
}));
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (!/^video\/(mp4|quicktime|webm|x-m4v)$/.test(file.mimetype)) {
      return cb(new Error("Định dạng chưa hỗ trợ. Hãy dùng MP4, MOV hoặc WebM."));
    }
    cb(null, true);
  }
});

const MODEL_OPENROUTER = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free";
const MODEL_GEMINI = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MODEL_GROQ_ASR = process.env.GROQ_ASR_MODEL || "whisper-large-v3-turbo";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let err = "";
    p.stderr.on("data", d => err += d);
    p.on("error", reject);
    p.on("close", code => code === 0 ? resolve() : reject(new Error(err.slice(-1600) || `${cmd} exited ${code}`)));
  });
}
function parseJson(text) {
  const clean = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try { return JSON.parse(clean); } catch {}
  const a = clean.indexOf("{"), b = clean.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(clean.slice(a, b + 1));
  throw new Error("AI không trả về JSON hợp lệ. Hãy thử lại với video ngắn hơn.");
}
const schema = `Bạn là đạo diễn hình ảnh và chuyên gia reverse-engineering video. Phân tích các frame được gửi theo thứ tự thời gian, cùng bản chép lời nếu có. Chỉ kết luận điều có bằng chứng; không bịa lời thoại, đạo cụ, tiêu cự, hành động giữa các frame. Ghi rõ điều chưa chắc chắn.
Trả về DUY NHẤT JSON hợp lệ với cấu trúc:
{
 "video_summary":{"summary":"","genre":"","mood":"","duration":""},
 "character_bible":[{"name":"","visual_description":"","wardrobe":"","continuity_notes":""}],
 "environment_bible":[{"name":"","description":"","lighting":"","palette":""}],
 "scenes":[{"timecode":"","duration_seconds":0,"visual_description":"","action":"","shot_type":"","camera_angle":"","camera_movement":"","subject_motion":"","lighting":"","color_palette":"","audio":"","edit_transition":"","image_prompt_vi":"","image_prompt_en":"","video_prompt_vi":"","video_prompt_en":""}],
 "master_style_prompt":"","negative_prompt":"","uncertainties":[]
}
Mỗi cảnh chia theo thay đổi hình ảnh/hành động/góc máy; timecode ước lượng dựa trên mốc frame. Prompt VI và EN phải tái tạo cảnh gốc, không thêm yếu tố không có. Video prompt phải nêu chủ thể, bối cảnh, hành động, camera, ánh sáng, màu, chuyển động, nhịp và thời lượng.`;

async function probeVideo(file) {
  const raw = await new Promise((resolve, reject) => {
    const p = spawn("ffprobe", ["-v","error","-show_entries","format=duration:stream=codec_type,width,height","-of","json",file]);
    let out = "";
    p.stdout.on("data", d => out += d);
    p.on("error", reject);
    p.on("close", c => c === 0 ? resolve(out) : reject(new Error("Không đọc được metadata video.")));
  });
  const j = JSON.parse(raw);
  const duration = Number(j.format?.duration || 0);
  if (!duration) throw new Error("Không xác định được thời lượng video.");
  return { duration, width: j.streams?.find(s=>s.codec_type==="video")?.width, height: j.streams?.find(s=>s.codec_type==="video")?.height };
}

async function extractFrames(videoPath, dir, granularity) {
  const interval = granularity.includes("3-5") ? 3 : granularity.includes("10-15") ? 10 : 5;
  const maxFrames = Math.min(Number(process.env.MAX_FRAMES || 18), 24);
  const framesDir = path.join(dir, "frames");
  await fs.mkdir(framesDir);
  await run("ffmpeg", ["-hide_banner","-loglevel","error","-i",videoPath,"-vf",`fps=1/${interval},scale=768:-2:force_original_aspect_ratio=decrease`,"-q:v","5","-frames:v",String(maxFrames),path.join(framesDir,"frame-%04d.jpg")]);
  const names = (await fs.readdir(framesDir)).filter(n=>n.endsWith(".jpg")).sort();
  if (!names.length) throw new Error("Không trích xuất được frame từ video.");
  const frames = [];
  for (let i=0;i<names.length;i++) frames.push({ time: i*interval, buffer: await fs.readFile(path.join(framesDir,names[i])) });
  return { frames, interval };
}

async function transcribeWithGroq(videoPath, dir) {
  if (!process.env.GROQ_API_KEY) return { text: "", model: null, note: "Chưa cấu hình GROQ_API_KEY; bỏ qua phiên âm." };
  const audioPath = path.join(dir, "audio.mp3");
  try {
    await run("ffmpeg", ["-hide_banner","-loglevel","error","-i",videoPath,"-vn","-ac","1","-ar","16000","-b:a","48k","-t","600",audioPath]);
    const audio = await fs.readFile(audioPath);
    if (!audio.length) return { text:"", model:MODEL_GROQ_ASR, note:"Video không có track âm thanh." };
    if (audio.length > 24 * 1024 * 1024) return { text:"", model:MODEL_GROQ_ASR, note:"Âm thanh vượt giới hạn phiên âm miễn phí; bỏ qua." };
    const form = new FormData();
    form.append("file", new Blob([audio], { type:"audio/mpeg" }), "audio.mp3");
    form.append("model", MODEL_GROQ_ASR);
    form.append("response_format", "verbose_json");
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method:"POST", headers:{ Authorization:`Bearer ${process.env.GROQ_API_KEY}` }, body:form,
      signal:AbortSignal.timeout(90000)
    });
    const j = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(j.error?.message || `Groq ASR HTTP ${r.status}`);
    return { text: j.text || "", segments: j.segments || [], model:MODEL_GROQ_ASR, note:"" };
  } catch (e) {
    return { text:"", model:MODEL_GROQ_ASR, note:`Không phiên âm được: ${e.message}` };
  }
}

async function analyzeOpenRouter(prompt, frames) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("Chưa cấu hình OPENROUTER_API_KEY.");
  const content = [{ type:"text", text:prompt }];
  for (const frame of frames) {
    content.push({ type:"text", text:`FRAME TIMECODE ~ ${frame.time.toFixed(1)} giây` });
    content.push({ type:"image_url", image_url:{ url:`data:image/jpeg;base64,${frame.buffer.toString("base64")}` } });
  }
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:"POST",
    headers:{
      "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type":"application/json",
      "HTTP-Referer":process.env.APP_ORIGIN || "https://nguyenhuyentrank-creator.github.io/yuki-cine-studio/",
      "X-Title":"YUKI CINE STUDIO V5"
    },
    body:JSON.stringify({
      model:MODEL_OPENROUTER,
      messages:[{role:"user",content}],
      temperature:0.2,
      response_format:{type:"json_object"},
      max_tokens:12000
    }),
    signal:AbortSignal.timeout(180000)
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(j.error?.message || `OpenRouter HTTP ${r.status}`);
  const text = j.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("OpenRouter trả về định dạng không được hỗ trợ.");
  return { analysis:parseJson(text), model:MODEL_OPENROUTER };
}

async function analyzeGemini(prompt, frames) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Chưa cấu hình GEMINI_API_KEY.");
  const parts = [{text:prompt}];
  for (const frame of frames) parts.push({text:`FRAME TIMECODE ~ ${frame.time.toFixed(1)} giây`},{inline_data:{mime_type:"image/jpeg",data:frame.buffer.toString("base64")}});
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_GEMINI}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({contents:[{role:"user",parts}],generationConfig:{responseMimeType:"application/json",temperature:0.2,maxOutputTokens:12000}}),
    signal:AbortSignal.timeout(180000)
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(j.error?.message || `Gemini HTTP ${r.status}`);
  const text = j.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("\n") || "";
  return { analysis:parseJson(text), model:MODEL_GEMINI };
}

async function getVideoFile(req, dir) {
  if (req.file) {
    const ext = path.extname(req.file.originalname || ".mp4").replace(/[^.a-z0-9]/gi,"") || ".mp4";
    const file = path.join(dir, "source"+ext);
    await fs.writeFile(file, req.file.buffer);
    return file;
  }
  const url = String(req.body.url || "").trim();
  if (!url) throw new Error("Hãy tải video lên hoặc dán link MP4 trực tiếp.");
  const u = new URL(url);
  if (!["http:","https:"].includes(u.protocol)) throw new Error("Chỉ hỗ trợ link HTTP/HTTPS.");
  const host = u.hostname.toLowerCase();
  if (["localhost","127.0.0.1","::1"].includes(host) || host.endsWith(".local")) throw new Error("Không cho phép URL nội bộ.");
  if (!/\.(mp4|mov|m4v|webm)(\?|$)/i.test(u.pathname+u.search)) {
    throw new Error("Link YouTube/TikTok/Facebook/Xiaohongshu thường không cho backend tải video trực tiếp. Hãy tải video bạn có quyền sử dụng về iPhone rồi tải tệp lên; hoặc dùng link MP4 công khai trực tiếp.");
  }
  const r = await fetch(u, { redirect:"follow", signal:AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error(`Không tải được link video (${r.status}).`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_UPLOAD_MB*1024*1024) throw new Error(`Video vượt giới hạn ${MAX_UPLOAD_MB} MB.`);
  const file = path.join(dir,"source-link-video");
  await fs.writeFile(file,buf);
  return file;
}

app.get("/api/health", (_req,res) => {
  const providers = {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY
  };
  res.json({
    ok:true, service:"YUKI CINE STUDIO V5 · Multi Free",
    aiReady: providers.openrouter || providers.gemini,
    mode:"multi-zero",
    providers,
    primary: providers.openrouter ? "OpenRouter" : providers.gemini ? "Gemini" : "Chưa cấu hình Vision AI",
    models:{ vision:MODEL_OPENROUTER, transcription:MODEL_GROQ_ASR, fallback:MODEL_GEMINI },
    hosting:"Render Free compatible"
  });
});
app.get("/health", (_req,res)=>res.json({ok:true,service:"YUKI CINE STUDIO V5 Multi Free"}));

app.post("/api/analyze-video", upload.single("video"), async (req,res) => {
  let dir;
  try {
    dir = await fs.mkdtemp(path.join(os.tmpdir(),"yuki-v5-"));
    const videoPath = await getVideoFile(req,dir);
    const meta = await probeVideo(videoPath);
    const {frames,interval} = await extractFrames(videoPath,dir,req.body.granularity || "5-8 giây");
    const transcript = await transcribeWithGroq(videoPath,dir);
    const prompt = `${schema}\n\nThông số nguồn: thời lượng ${meta.duration.toFixed(2)} giây; độ phân giải ${meta.width||"?"}x${meta.height||"?"}; khoảng lấy mẫu frame khoảng ${interval} giây. Mức chi tiết: ${req.body.granularity||"5-8 giây"}. Ngôn ngữ: ${req.body.language||"Tiếng Việt"}. Trọng tâm: ${req.body.focus||"Toàn diện"}. Bản chép lời từ Groq nếu có:\n${transcript.text || "(Không có bản chép lời; không tự bịa lời thoại.)"}\n\nHãy dựng timeline theo frame timecode, phân chia cảnh hợp lý, không khẳng định chính xác hơn dữ liệu quan sát.`;
    const requested = req.body.provider || "auto";
    let result, usedProvider, fallbackNote = "";
    if (requested === "gemini") {
      result = await analyzeGemini(prompt,frames); usedProvider="Gemini";
    } else if (requested === "openrouter") {
      result = await analyzeOpenRouter(prompt,frames); usedProvider="OpenRouter";
    } else {
      if (process.env.OPENROUTER_API_KEY) {
        try { result = await analyzeOpenRouter(prompt,frames); usedProvider="OpenRouter"; }
        catch (e) {
          fallbackNote = `OpenRouter lỗi (${e.message}); `;
          if (!process.env.GEMINI_API_KEY) throw e;
        }
      }
      if (!result && process.env.GEMINI_API_KEY) {
        result = await analyzeGemini(prompt,frames); usedProvider="Gemini"; fallbackNote += "Đã tự chuyển sang Gemini.";
      }
      if (!result) throw new Error("Chưa có Vision AI khả dụng. Hãy thêm OPENROUTER_API_KEY (miễn phí) hoặc GEMINI_API_KEY vào biến môi trường backend.");
    }
    result.analysis.audio_transcript = transcript.text || "";
    result.analysis.audio_transcript_note = transcript.note || "";
    result.analysis.audio_segments = transcript.segments || [];
    res.json({
      ok:true, provider:usedProvider, model:result.model,
      fallback_note:fallbackNote,
      video:{duration_seconds:meta.duration,width:meta.width,height:meta.height,framesAnalyzed:frames.length,frameIntervalSeconds:interval},
      audio:{provider:transcript.model ? "Groq" : "Chưa bật",transcribed:!!transcript.text,note:transcript.note||""},
      analysis:result.analysis,
      limitations:[
        "Phân tích hình ảnh dựa trên các frame trích xuất, không phải từng mili-giây của video; chuyển động giữa các frame có thể bị bỏ sót.",
        "Groq Whisper chỉ phiên âm âm thanh; không thay thế phân tích hình ảnh.",
        "Link mạng xã hội thường không thể tải trực tiếp; hãy tải tệp video bạn có quyền sử dụng lên iPhone."
      ]
    });
  } catch(e) {
    console.error(e);
    const status = /vượt giới hạn/i.test(e.message) ? 413 : 400;
    res.status(status).json({error:e.message || "Phân tích video thất bại."});
  } finally {
    if (dir) await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});
  }
});

app.use((err,_req,res,_next)=>{
  const status = err.code==="LIMIT_FILE_SIZE" ? 413 : 400;
  res.status(status).json({error:err.message || "Yêu cầu không hợp lệ."});
});
app.listen(PORT,()=>console.log(`YUKI CINE STUDIO V5 Multi Free listening on ${PORT}`));
