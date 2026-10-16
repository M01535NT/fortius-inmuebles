"use client";
/* eslint-disable @next/next/no-img-element -- Previews use local blob/data URLs and must not pass through the server image optimizer. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { btnGhost, btnPrimary, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { apiRequest, errorMessage, uploadFile } from "@/lib/admin/store";
import { compareTexts, safePublicUrl, transformPdf } from "@/lib/apps/documents";
import type { AppEditorProps } from "@/lib/apps/types";
import styles from "./apps.module.css";
type SavedFile={id:string;name:string;url:string;mime:string};
type PagePick={file:number;page:number;rotation:number};
async function upload(bytes:Blob,name:string,expedienteId?:string):Promise<SavedFile>{
 const uploaded=await uploadFile(new File([bytes],name,{type:bytes.type}),"private");
 const data=await apiRequest<{file:SavedFile}>("/api/admin/apps/media","POST",{name,mime:bytes.type,storagePath:uploaded.path,...(expedienteId?{expedienteId}:{})});return data.file;
}
async function downloadBytes(id:string){const response=await fetch(`/api/admin/apps/media?id=${id}`,{cache:"no-store"});if(!response.ok)throw new Error("No se pudo recuperar el archivo original");return response.blob();}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
type PendingOriginal = { file: File; path?: string; saved?: SavedFile };
async function conserveOriginal(pending: PendingOriginal, expedienteId?: string): Promise<SavedFile> {
 if (pending.saved) return pending.saved;
 if (!pending.path) pending.path = (await uploadFile(pending.file, "private")).path;
 const response = await apiRequest<{file: SavedFile}>("/api/admin/apps/media", "POST", { name: pending.file.name, mime: pending.file.type, storagePath: pending.path, ...(expedienteId ? {expedienteId} : {}) });
 pending.saved = response.file;
 return response.file;
}
function PdfEditor({input,onChange,onResult,context,onBusyChange}:AppEditorProps){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const pending=useRef<PendingOriginal[]>([]);
 useEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
 const picks=Array.isArray(input.pages)?input.pages as PagePick[]:[];
 const originals=Array.isArray(input.originals)?input.originals as SavedFile[]:[];
 const output=input.output as SavedFile|undefined;
 async function select(files?:File[]){
  if(files){if(!files.length)return;pending.current=files.map(file=>({file}));}
  setError("");setBusy(true);
  try{
   const entries=pending.current;
   if(!entries.length||entries.length>10||entries.reduce((n,entry)=>n+entry.file.size,0)>20*1024*1024)throw new Error("Selecciona hasta 10 PDF y un máximo conjunto de 20 MB.");
   const pages:PagePick[]=[];
   for(let i=0;i<entries.length;i++){const pdf=await PDFDocument.load(await entries[i].file.arrayBuffer());for(let p=1;p<=pdf.getPageCount();p++)pages.push({file:i,page:p,rotation:0});}
   if(!pages.length||pages.length>100)throw new Error("Selecciona entre 1 y 100 páginas por trabajo.");
   const saved:SavedFile[]=[];
   for(const entry of entries)saved.push(await conserveOriginal(entry,context.expedienteId));
   onChange({...input,pages,originals:saved,output:null,names:entries.map(entry=>entry.file.name)});
   pending.current=[];
  }catch(e){setError(`${errorMessage(e)} La selección anterior se conserva. Reintenta la carga sin cerrar esta herramienta.`);}finally{setBusy(false);}
 }
 async function generate(){setBusy(true);setError("");try{
  if(!originals.length)throw new Error("Vuelve a seleccionar los PDF para conservar sus originales.");
  const source=await Promise.all(originals.map(f=>downloadBytes(f.id)));
  const bytes=await Promise.all(source.map(async f=>new Uint8Array(await f.arrayBuffer())));
  const edited=await transformPdf(bytes,picks);
  const file=await upload(new Blob([new Uint8Array(edited)],{type:"application/pdf"}),"fortius-documento.pdf",context.expedienteId);
  onChange({...input,output:file});onResult({title:"Documento preparado",summary:[{label:"Páginas",value:String(picks.length)},{label:"Originales conservados",value:String(originals.length)}],sections:[{title:"Archivo",text:file.name}],warnings:["La transformación crea una copia. Si el original estaba firmado, la nueva copia no conserva la validez de su firma digital."]});download(new Blob([new Uint8Array(edited)],{type:"application/pdf"}),file.name);
 }catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 const names=Array.isArray(input.names)?input.names as string[]:originals.map(f=>f.name);
 return <div className="space-y-4"><div className={styles.notice}><Link className="underline" href={context.expedienteId?`/admin/operaciones/${encodeURIComponent(context.expedienteId)}?tab=documentos`:"/admin/operaciones"}>Abrir formatos del expediente</Link><p>Los contratos y formatos existentes se rellenan y emiten desde su expediente.</p></div><label className={styles.field}>PDF originales<input type="file" multiple accept="application/pdf" disabled={busy} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value="";void select(files);}}/></label><p className="text-sm text-muted-foreground">Los originales se conservan en privado al seleccionarlos. Después puedes ordenar, girar o eliminar páginas y guardar el borrador.</p><div className={styles.fileList}>{picks.map((p,i)=><div className={styles.fileRow} key={`${i}-${p.file}-${p.page}`}><span>{names[p.file]} · página {p.page} · {p.rotation}°</span><button disabled={busy||i===0} aria-label={`Subir página ${i+1}`} onClick={()=>{const next=[...picks];[next[i-1],next[i]]=[next[i],next[i-1]];onChange({...input,pages:next,output:null});}}>↑</button><button disabled={busy||i===picks.length-1} aria-label={`Bajar página ${i+1}`} onClick={()=>{const next=[...picks];[next[i+1],next[i]]=[next[i],next[i+1]];onChange({...input,pages:next,output:null});}}>↓</button><button disabled={busy} aria-label={`Girar página ${i+1}`} onClick={()=>onChange({...input,pages:picks.map((row,j)=>j===i?{...row,rotation:(row.rotation+90)%360}:row),output:null})}>Girar</button><button disabled={busy} aria-label={`Quitar página ${i+1}`} onClick={()=>onChange({...input,pages:picks.filter((_,j)=>j!==i),output:null})}>Quitar</button></div>)}</div>{!!picks.length&&!originals.length&&<p role="alert">Este borrador no conserva sus originales. Vuelve a seleccionar los PDF.</p>}{error&&<p role="alert">{error}</p>}{error&&<button className={btnGhost} disabled={busy} onClick={()=>void select()}>Reintentar carga de originales</button>}<button className={btnPrimary} disabled={busy||!picks.length||!originals.length} onClick={generate}>{busy?"Preparando…":"Generar y conservar PDF"}</button>{output&&<a className={btnGhost} href={`/api/admin/apps/media?id=${output.id}`} download>Descargar documento</a>}</div>;
}
function VersionEditor({input,onChange,onResult}:AppEditorProps){const [error,setError]=useState("");const a=String(input.before??""),b=String(input.after??"");return <div className="space-y-4"><p className="text-sm text-muted-foreground">Pega el texto de dos versiones, incluido el texto revisado en el lector de documentos. La comparación cubre texto; las imágenes y firmas requieren revisión aparte.</p><div className={styles.diff}><label className={styles.field}>Versión anterior<textarea className={textareaClass} maxLength={200000} value={a} onChange={e=>onChange({...input,before:e.target.value})}/></label><label className={styles.field}>Versión nueva<textarea className={textareaClass} maxLength={200000} value={b} onChange={e=>onChange({...input,after:e.target.value})}/></label></div><label className={styles.field}>Procedencia<input className={inputClass} placeholder="Nombres de los documentos, versiones y origen del texto" value={String(input.source??"")} onChange={e=>onChange({...input,source:e.target.value})}/></label><label><input type="checkbox" checked={!!input.ocr} onChange={e=>onChange({...input,ocr:e.target.checked})}/> Contiene texto extraído por OCR</label>{error&&<p role="alert">{error}</p>}<button className={btnPrimary} onClick={()=>{try{if(!a.trim()||!b.trim())throw new Error("Agrega ambas versiones.");const changes=compareTexts(a,b);onResult({title:"Comparación de versiones",summary:[{label:"Líneas agregadas",value:String(changes.filter(c=>c.kind==="added").length)},{label:"Líneas eliminadas",value:String(changes.filter(c=>c.kind==="removed").length)}],sections:[{title:"Procedencia",text:String(input.source??"Captura manual")},{title:"Cambios",columns:["Estado","Texto"],rows:changes.map(c=>[{same:"Sin cambio",added:"Agregado",removed:"Eliminado"}[c.kind],c.text])}],warnings:[input.ocr?"El texto procede de OCR. Comprueba los cambios contra las páginas originales.":"Revisa por separado las imágenes, firmas y diferencias de formato."]});setError("");}catch(e){setError(errorMessage(e));}}}>Comparar versiones</button></div>;}
async function renderPhoto(source:Blob,input:AppEditorProps["input"]){const bitmap=await createImageBitmap(source);if(bitmap.width*bitmap.height>40000000){bitmap.close();throw new Error("La imagen supera 40 megapíxeles.");}const margin=Number(input.crop??0)/100;const rotation=Number(input.rotation??0);const w=Math.round(bitmap.width*(1-margin*2)),h=Math.round(bitmap.height*(1-margin*2));const canvas=document.createElement("canvas");const scale=Math.min(1,2000/Math.max(w,h));canvas.width=Math.round((rotation%180?h:w)*scale);canvas.height=Math.round((rotation%180?w:h)*scale);const c=canvas.getContext("2d")!;c.fillStyle="#fff";c.fillRect(0,0,canvas.width,canvas.height);c.save();c.translate(canvas.width/2,canvas.height/2);c.rotate(rotation*Math.PI/180);c.filter=`brightness(${Number(input.brightness??100)}%) contrast(${Number(input.contrast??100)}%)`;c.drawImage(bitmap,bitmap.width*margin,bitmap.height*margin,w,h,-w*scale/2,-h*scale/2,w*scale,h*scale);c.restore();bitmap.close();if(input.watermark){c.fillStyle="rgba(6,31,63,.72)";c.fillRect(0,canvas.height-46,canvas.width,46);c.font="bold 18px sans-serif";c.fillStyle="white";c.fillText(String(input.watermark).slice(0,80),18,canvas.height-16);}const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error("No se pudo crear la fotografía")),"image/jpeg",Number(input.quality??85)/100));return {blob,width:canvas.width,height:canvas.height};}
function PhotoEditor({input,onChange,onResult,context,onBusyChange}:AppEditorProps){
 const [source,setSource]=useState<{id:string;blob:Blob}|null>(null),[preview,setPreview]=useState<{key:string;url:string}|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[attempt,setAttempt]=useState(0);
 const pending=useRef<PendingOriginal|null>(null);
 const original=input.original as SavedFile|undefined;
 const originalId=original?.id;
 const previewKey=JSON.stringify([originalId,input.crop,input.rotation,input.brightness,input.contrast,input.quality,input.watermark]);
 useEffect(()=>{onBusyChange?.(busy||loading);return()=>onBusyChange?.(false);},[busy,loading,onBusyChange]);
 useEffect(()=>{let url="",active=true;if(source&&source.id===originalId)renderPhoto(source.blob,input).then(({blob})=>{if(active){url=URL.createObjectURL(blob);setPreview({key:previewKey,url});}}).catch(e=>{if(active)setError(errorMessage(e));});return()=>{active=false;if(url)URL.revokeObjectURL(url);};},[source,input,originalId,previewKey]);
 useEffect(()=>{
  if(!originalId||source?.id===originalId)return;
  let active=true;
  async function recover(){setLoading(true);try{const blob=await downloadBytes(originalId!);if(active){setSource({id:originalId!,blob});setError("");}}catch(e){if(active)setError(errorMessage(e));}finally{if(active)setLoading(false);}}
  void recover();return()=>{active=false;};
 },[originalId,source,attempt]);
 async function select(file?:File){
  if(file)pending.current={file};
  const entry=pending.current;if(!entry)return;
  setBusy(true);setError("");
  try{
   if(!["image/jpeg","image/png"].includes(entry.file.type)||!entry.file.size||entry.file.size>10*1024*1024)throw new Error("Usa JPG o PNG de hasta 10 MB.");
   const next={name:entry.file.name,brightness:100,contrast:100,quality:85,crop:0,rotation:0,watermark:"FORTIUS"};
   await renderPhoto(entry.file,next);
   const saved=await conserveOriginal(entry,context.expedienteId);
   setSource({id:saved.id,blob:entry.file});onChange({...next,original:saved,output:null});pending.current=null;
  }catch(e){setError(`${errorMessage(e)} La fotografía y los ajustes anteriores se conservan. Reintenta sin cerrar esta herramienta.`);}finally{setBusy(false);}
 }
 async function generate(){if(!source||source.id!==originalId||!original)return;setBusy(true);setError("");try{const {blob,width,height}=await renderPhoto(source.blob,input);const output=await upload(blob,"fortius-fotografia.jpg",context.expedienteId);onChange({...input,output});onResult({title:"Fotografía preparada",summary:[{label:"Dimensiones",value:`${width} × ${height} px`},{label:"Peso",value:`${Math.ceil(blob.size/1024)} KB`}],warnings:["Se conserva el original. La copia JPEG generada no incluye los metadatos GPS del archivo de origen."]});download(blob,output.name);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 return <fieldset disabled={busy||loading} className="space-y-4"><label className={styles.field}>Fotografía original<input type="file" accept="image/jpeg,image/png" onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void select(file);}}/></label><p className="text-sm text-muted-foreground">El original se conserva en privado antes de habilitar el guardado del borrador.</p>{preview?.key===previewKey&&<img className={styles.preview} src={preview.url} alt="Vista previa de la fotografía editada"/>}<div className={styles.fields}>{[{key:"brightness",label:"Luz",min:50,max:150,default:100},{key:"contrast",label:"Contraste",min:50,max:150,default:100},{key:"quality",label:"Calidad JPEG",min:40,max:95,default:85},{key:"crop",label:"Recorte por cada borde (%)",min:0,max:35,default:0}].map(f=><label key={f.key} className={styles.field}>{f.label}: {String(input[f.key]??f.default)}<input type="range" min={f.min} max={f.max} value={Number(input[f.key]??f.default)} onChange={e=>onChange({...input,[f.key]:Number(e.target.value),output:null})}/></label>)}<label className={styles.field}>Giro<select className={selectClass} value={Number(input.rotation??0)} onChange={e=>onChange({...input,rotation:Number(e.target.value),output:null})}>{[0,90,180,270].map(v=><option key={v} value={v}>{v}°</option>)}</select></label><label className={styles.field}>Marca de agua<input className={inputClass} maxLength={80} value={String(input.watermark??"")} onChange={e=>onChange({...input,watermark:e.target.value,output:null})}/></label></div>{loading&&<p role="status">Recuperando original…</p>}{error&&<><p role="alert">{error}</p><button className={btnGhost} onClick={()=>{if(pending.current)void select();else setAttempt(value=>value+1);}}>Reintentar carga del original</button></>}<button className={btnPrimary} disabled={busy||loading||!source||source.id!==originalId} onClick={generate}>{busy?"Preparando…":"Generar y conservar fotografía"}</button>{!!input.output&&<a className={btnGhost} download href={`/api/admin/apps/media?id=${(input.output as SavedFile).id}`}>Descargar copia</a>}</fieldset>;
}
type SharedFile={id:string;file_id:string;expires_at:string;revoked:boolean};
function confirmedQrUrl(input:AppEditorProps["input"],share:SharedFile|undefined,now:number){
 const value=typeof input.qrUrl==="string"?input.qrUrl:input.kind==="private"&&input.shareId?String(input.url??""):"";
 if(!value)return "";
 if(value.length>2048)throw new Error("El enlace supera el máximo de 2048 caracteres para el código QR.");
 if(input.kind!=="private")return value===input.url?safePublicUrl(value):"";
 if(!share||share.revoked||input.revoked||share.file_id!==input.fileId||!Number.isFinite(Date.parse(share.expires_at))||Date.parse(share.expires_at)<=now)return "";
 const url=new URL(value);
 if((url.origin!==window.location.origin&&(url.protocol!=="https:"||!["fortiusinmuebles.com","www.fortiusinmuebles.com"].includes(url.hostname)))||url.username||url.password||url.search||url.hash||!/^\/api\/apps\/shared\/[A-Za-z0-9_-]+$/.test(url.pathname))throw new Error("El enlace privado guardado no es válido. Crea un enlace nuevo.");
 return url.href;
}
function QrEditor({input,onChange,onResult,onBusyChange}:AppEditorProps){
 const [qr,setQr]=useState<{url:string;image:string}|null>(null),[error,setError]=useState(""),[files,setFiles]=useState<SavedFile[]>([]),[busy,setBusy]=useState(false),[shares,setShares]=useState<SharedFile[]>([]),[loaded,setLoaded]=useState(false),[loadError,setLoadError]=useState(""),[attempt,setAttempt]=useState(0),[now,setNow]=useState(()=>Date.now());
 useEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
 useEffect(()=>{
  let active=true;
  Promise.all([apiRequest<{files:SavedFile[]}>("/api/admin/apps/media"),apiRequest<{shares:SharedFile[]}>("/api/admin/apps/shares")]).then(([media,links])=>{if(active){setFiles(media.files);setShares(links.shares);setLoaded(true);setLoadError("");setNow(Date.now());}}).catch(e=>{if(active){setLoadError(errorMessage(e));setLoaded(false);}});
  return()=>{active=false;};
 },[attempt]);
 const currentShare=shares.find(share=>share.id===input.shareId);
 const expiry=currentShare?.expires_at;
 useEffect(()=>{if(!expiry)return;const wait=Date.parse(expiry)-now;if(!Number.isFinite(wait)||wait<0)return;const timer=setTimeout(()=>setNow(Date.now()),Math.min(wait+1,2147483647));return()=>clearTimeout(timer);},[expiry,now]);
 let destination="",validationError="";
 try{destination=confirmedQrUrl(input,loaded?currentShare:undefined,now);}catch(e){validationError=errorMessage(e);}
 useEffect(()=>{let active=true;if(destination)QRCode.toDataURL(destination,{width:512,margin:3,errorCorrectionLevel:"M"}).then(image=>{if(active){setQr({url:destination,image});setError("");}}).catch(e=>{if(active){setQr(null);setError(errorMessage(e));}});return()=>{active=false;};},[destination]);
 async function make(shared=false){
  setError("");setBusy(true);
  try{
   let url:string;
   let next:AppEditorProps["input"];
   if(shared){
    if(!loaded||!files.some(file=>file.id===input.fileId))throw new Error("Selecciona un documento disponible antes de compartirlo.");
    const response=await apiRequest<{share:{id:string;url:string;expiresAt:string}}>("/api/admin/apps/shares","POST",{fileId:input.fileId});
    url=response.share.url;
    next={...input,url,qrUrl:url,kind:"private",shareId:response.share.id,expiresAt:response.share.expiresAt,revoked:false};
    setShares(old=>[{id:response.share.id,file_id:String(input.fileId),expires_at:response.share.expiresAt,revoked:false},...old.filter(item=>item.id!==response.share.id)]);
   }else{
    url=safePublicUrl(String(input.url??""));
    if(url.length>2048)throw new Error("El enlace supera el máximo de 2048 caracteres para el código QR.");
    next={...input,url,qrUrl:url,kind:"public",shareId:null,expiresAt:null,revoked:false};
   }
   // Preserve a created share even if the image renderer fails, so it remains revocable.
   onChange(next);
   const image=await QRCode.toDataURL(url,{width:512,margin:3,errorCorrectionLevel:"M"});
   setQr({url,image});
   onResult({title:"Enlace y código QR",summary:[{label:"Tipo",value:shared?"Documento privado compartido":"Ficha pública"}],sections:[{title:"Destino",text:url}],warnings:shared?["Este enlace permite descargar el documento a quien lo reciba. Caduca en siete días y puede revocarse."]:[]});
  }catch(e){setQr(null);setError(errorMessage(e));}finally{setBusy(false);}
 }
 async function revoke(id:string){setBusy(true);setError("");try{await apiRequest("/api/admin/apps/shares","PATCH",{id});setShares(old=>old.map(item=>item.id===id?{...item,revoked:true}:item));if(input.shareId===id){onChange({...input,revoked:true});setQr(null);}}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 const revoked=input.revoked===true||currentShare?.revoked===true;
 const expired=!!currentShare&&Date.parse(currentShare.expires_at)<=now;
 const image=destination&&qr?.url===destination?qr.image:"";
 return <fieldset disabled={busy} className="space-y-4"><label className={styles.field}>Enlace público del inmueble<input className={inputClass} type="url" maxLength={2048} placeholder="https://fortiusinmuebles.com/inventario/…" value={input.kind==="private"?"":String(input.url??"")} onChange={e=>{setError("");onChange({...input,url:e.target.value,qrUrl:null,kind:"public",shareId:null,expiresAt:null,revoked:false});}}/></label><button className={btnPrimary} onClick={()=>void make()}>Crear QR de ficha pública</button><hr className="border-border"/><label className={styles.field}>Documento conservado en las apps<select className={selectClass} value={String(input.fileId??"")} onChange={e=>{setError("");onChange({...input,fileId:e.target.value,url:"",qrUrl:null,kind:"private",shareId:null,expiresAt:null,revoked:false});}}><option value="">Selecciona un archivo</option>{files.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><p className="text-sm text-muted-foreground">Al crear el enlace autorizas compartir este archivo con las personas que lo reciban. Caducará en siete días.</p><button className={btnGhost} disabled={!loaded||!files.some(file=>file.id===input.fileId)} onClick={()=>void make(true)}>Compartir documento y crear QR</button>{loadError&&<div role="alert"><p>{loadError}</p><button className={btnGhost} onClick={()=>setAttempt(value=>value+1)}>Reintentar consulta de archivos y enlaces</button></div>}{(error||validationError)&&<p role="alert">{error||validationError}</p>}{image&&<div><img width={256} height={256} src={image} alt="Código QR generado"/><a className={btnGhost} download="fortius-qr.png" href={image}>Descargar QR</a></div>}{typeof input.shareId==="string"&&<><p role="status">{!loaded?"Consultando vigencia del enlace…":revoked?"Enlace revocado":expired?"Enlace vencido":currentShare?`Enlace vigente hasta ${new Date(currentShare.expires_at).toLocaleDateString("es-MX")}`:"No se pudo confirmar la vigencia de este enlace. Crea uno nuevo."}</p><button className={btnGhost} disabled={!loaded||!currentShare||revoked} onClick={()=>void revoke(String(input.shareId))}>Revocar este enlace</button></>}{shares.length>0&&<details><summary>Enlaces anteriores</summary>{shares.map(s=><p key={s.id} className={styles.fileRow}><span>{files.find(f=>f.id===s.file_id)?.name??"Documento"} · {s.revoked?"Revocado":Date.parse(s.expires_at)<=now?"Vencido":`Vence ${new Date(s.expires_at).toLocaleDateString("es-MX")}`}</span>{!s.revoked&&<button onClick={()=>void revoke(s.id)}>Revocar</button>}</p>)}</details>}</fieldset>;
}
export function DocumentEditor(props:AppEditorProps){switch(props.slug){case"pdf":return <PdfEditor {...props}/>;case"versiones":return <VersionEditor {...props}/>;case"fotografias":return <PhotoEditor {...props}/>;case"qr":return <QrEditor {...props}/>;default:return null;}}
