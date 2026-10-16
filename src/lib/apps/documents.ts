import { PDFDocument, degrees } from "pdf-lib";
export async function transformPdf(files: Uint8Array[], selection: { file: number; page: number; rotation: number }[]) {
  if(!files.length||files.length>10||!selection.length||selection.length>100)throw new Error("Selecciona entre 1 y 100 páginas de hasta 10 archivos.");
  if(files.reduce((n,f)=>n+f.byteLength,0)>20*1024*1024)throw new Error("Los archivos superan 20 MB.");
  const sources=await Promise.all(files.map(f=>PDFDocument.load(f))); const output=await PDFDocument.create();
  for(const item of selection){if(!Number.isInteger(item.file)||!Number.isInteger(item.page)||![0,90,180,270].includes(item.rotation)||!sources[item.file]||item.page<1||item.page>sources[item.file].getPageCount())throw new Error("Página o giro inválido.");const [page]=await output.copyPages(sources[item.file],[item.page-1]);page.setRotation(degrees((page.getRotation().angle+item.rotation)%360));output.addPage(page);}
  return output.save();
}
type TextChange={kind:"same"|"added"|"removed";text:string};
export function compareTexts(before:string,after:string):TextChange[]{
  const a=before.replaceAll("\r\n","\n").split("\n"),b=after.replaceAll("\r\n","\n").split("\n");
  if(a.length>2000||b.length>2000||before.length>200000||after.length>200000)throw new Error("Compara hasta 2,000 líneas y 200,000 caracteres por versión.");
  const lengths=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)lengths[i][j]=a[i]===b[j]?lengths[i+1][j+1]+1:Math.max(lengths[i+1][j],lengths[i][j+1]);
  const changes:TextChange[]=[];let i=0,j=0;
  while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){changes.push({kind:"same",text:a[i++]});j++;}else if(i<a.length&&(j===b.length||lengths[i+1][j]>=lengths[i][j+1]))changes.push({kind:"removed",text:a[i++]});else changes.push({kind:"added",text:b[j++]});}return changes;
}
export function safePublicUrl(value:string){const url=new URL(value);if(url.protocol!=="https:"||url.username||url.password||url.port||!["fortiusinmuebles.com","www.fortiusinmuebles.com"].includes(url.hostname)||!/^\/(propiedad|propiedades|inventario)(\/|$)/.test(url.pathname))throw new Error("Usa un enlace público de inmueble o inventario de Fortius.");url.hash="";url.search="";return url.href;}
