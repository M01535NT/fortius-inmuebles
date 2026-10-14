import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import type { AppResult } from "./types";

/** Shared branded export; cells wrap and continue across pages without dropping rows. */
export async function buildAppPdf(result: AppResult, photos: Uint8Array[] = []) {
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const [regular,bold]=await Promise.all([
  readFile(path.join(process.cwd(),"public/fonts/Archivo-Regular.ttf")).then(bytes=>doc.embedFont(bytes,{subset:true})),
  readFile(path.join(process.cwd(),"public/fonts/Archivo-SemiBold.ttf")).then(bytes=>doc.embedFont(bytes,{subset:true})),
 ]);
 const width=612,height=792,margin=44,content=width-margin*2;
 const navy=rgb(.025,.12,.25),ink=rgb(.08,.12,.18),muted=rgb(.38,.42,.48),rule=rgb(.85,.87,.90);
 let page=doc.addPage([width,height]),y=680;
 function header(){page.drawRectangle({x:0,y:height-8,width,height:8,color:navy});page.drawText("FORTIUS",{x:margin,y:748,font:bold,size:21,color:navy});page.drawText("INMUEBLES",{x:margin,y:732,font:regular,size:9,color:muted});page.drawLine({start:{x:margin,y:716},end:{x:width-margin,y:716},color:rgb(.54,.09,.20),thickness:2});}
 function next(){page=doc.addPage([width,height]);header();y=686;}
 function ensure(space:number){if(y-space<58)next();}
 function clean(value:string){return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").replace(/\t/g,"    ");}
 function wrap(value:string,font:PDFFont,size:number,maxWidth:number){const lines:string[]=[];for(const para of clean(value).split(/\r?\n/)){let line="";for(const word of para.split(/(\s+)/)){if(font.widthOfTextAtSize(line+word,size)<=maxWidth){line+=word;continue;}if(line.trim()){lines.push(line.trimEnd());line="";}for(const char of word.trimStart()){if(font.widthOfTextAtSize(line+char,size)>maxWidth&&line){lines.push(line);line="";}line+=char;}}lines.push(line.trimEnd());}return lines;}
 function text(value:string,size=10,strong=false,color=ink){const font=strong?bold:regular;for(const line of wrap(value,font,size,content)){ensure(size*1.5);page.drawText(line,{x:margin,y,font,size,color});y-=size*1.5;}}
 function table(columns:string[],rows:string[][]){
  const count=Math.max(columns.length,...rows.map(row=>row.length),1);
  if(count>8){for(const [index,row] of rows.entries()){ensure(45);text(`Registro ${index+1}`,10,true);row.forEach((cell,i)=>text(`${columns[i]??i+1}: ${cell}`,9));y-=10;}return;}
  const weights=Array.from({length:count},(_,i)=>Math.max(7,Math.min(28,Math.max(...[columns[i]??"",...rows.map(r=>r[i]??"")].map(v=>v.length)))));
  const total=weights.reduce((a,b)=>a+b,0),widths=weights.map(v=>content*v/total);
  const drawRow=(cells:string[],head=false)=>{const font=head?bold:regular,size=head?8:8.5;const lines=widths.map((w,i)=>wrap(cells[i]??"",font,size,w-12));let at=0;const length=Math.max(...lines.map(l=>l.length));while(at<length){ensure(30);const available=Math.max(1,Math.floor((y-58-12)/13));const take=Math.min(length-at,available),h=take*13+12;let x=margin;
   if(head)page.drawRectangle({x,y:y-h+7,width:content,height:h,color:rgb(.94,.95,.97)});
   widths.forEach((w,i)=>{for(let line=0;line<take;line++){const value=lines[i][at+line];if(value)page.drawText(value,{x:x+6,y:y-7-line*13,font,size,color:ink});}x+=w;});
   page.drawLine({start:{x:margin,y:y-h+6},end:{x:width-margin,y:y-h+6},color:rule,thickness:.5});y-=h;at+=take;if(at<length)next();
  }};
  ensure(65);if(columns.length)drawRow(columns,true);
  for(const row of rows){if(y<95){next();if(columns.length)drawRow(columns,true);}drawRow(row);}y-=8;
 }
 header();text(result.title,18,true);y-=12;
 for(const metric of result.summary){text(metric.label,9,false,muted);text(metric.value,12,true);y-=8;}
 for(const bytes of photos){const image=await doc.embedJpg(bytes);const h=Math.min(260,content*image.height/image.width);ensure(h+18);page.drawImage(image,{x:margin,y:y-h,width:h*image.width/image.height,height:h});y-=h+18;}
 for(const section of result.sections??[]){ensure(65);y-=12;text(section.title,12,true);y-=6;if(section.text)text(section.text);if(section.rows?.length)table(section.columns??[],section.rows);}
 if(result.warnings?.length){ensure(55);y-=12;text("Observaciones",11,true);for(const warning of result.warnings){y-=6;text(warning,9,false,muted);}}
 const pages=doc.getPages();pages.forEach((p,i)=>p.drawText(`fortiusinmuebles.com  |  ${i+1} / ${pages.length}`,{x:margin,y:28,font:regular,size:8,color:muted}));return doc.save();
}
