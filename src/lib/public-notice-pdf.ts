import 'server-only';
import { drawFortiusLetterhead, embedFortiusLetterhead } from './pdf-letterhead';
import { letterheadBounds } from './letterhead';
import { loadLetterhead } from './letterhead-server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import type { noticeContent } from './public-notices';
export async function createNoticePdf(content: NonNullable<ReturnType<typeof noticeContent>>) {
  const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
  pdf.setTitle(content.title); pdf.setAuthor('Fortius Inmuebles'); pdf.setLanguage('es-MX');
  const regular=await pdf.embedFont(await readFile(join(process.cwd(),'public/fonts/Archivo-Regular.ttf')), {subset:true});
  const bold=await pdf.embedFont(await readFile(join(process.cwd(),'public/fonts/Archivo-SemiBold.ttf')), {subset:true});
  const art=await embedFortiusLetterhead(pdf,await loadLetterhead());
  const body=letterheadBounds(595,842);
  const width=483; let page=pdf.addPage([595,842]);let y=body.bodyTop-25;

  function room(height:number){if(y-height<body.bottom){page=pdf.addPage([595,842]);y=body.bodyTop-13;}}
  function paragraph(text:string,size=11,heading=false){
    const font=heading?bold:regular;const words=text.split(/\s+/);const lines:string[][]=[];let line:string[]=[];
    for(const word of words){if(line.length && font.widthOfTextAtSize([...line,word].join(' '),size)>width){lines.push(line);line=[];}line.push(word);}if(line.length)lines.push(line);
    if(heading)room(lines.length*size*1.5+42);
    else if(lines.length*size*1.5<=300)room(lines.length*size*1.5);
    lines.forEach((words,i)=>{room(size*1.5);const natural=font.widthOfTextAtSize(words.join(' '),size);const extra=!heading&&i<lines.length-1&&words.length>1?(width-natural)/(words.length-1):0;let x=56;
      words.forEach(word=>{page.drawText(word,{x,y,size,font,color:rgb(.06,.07,.09)});x+=font.widthOfTextAtSize(word+' ',size)+extra;});y-=size*1.5;});y-=heading?8:12;
  }
  paragraph(content.title,25,true);y-=8;
  for(const section of content.sections){paragraph(section.title,13,true);for(const text of section.paragraphs)paragraph(text);y-=8;}
  pdf.getPages().forEach((p,i)=>drawFortiusLetterhead(p,art,bold,content.title,i+1,pdf.getPageCount()));
  return pdf.save();
}
