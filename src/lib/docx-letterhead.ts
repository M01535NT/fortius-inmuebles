import { AlignmentType, Footer, Header, HorizontalPositionRelativeFrom, ImageRun, PageNumber, Paragraph, TextRun, VerticalPositionRelativeFrom } from 'docx';
import type { LetterheadAssets } from './letterhead';

/** Carta. El arte se ancla a la página, fuera del flujo editable del documento. */
export function fortiusDocxSection(assets: LetterheadAssets, title: string, sideMargin = 1008) {
  const image = (data: Uint8Array, height: number, top: number) => new ImageRun({
    type:'png', data, transformation:{width:816,height:height*96/72},
    floating:{ horizontalPosition:{relative:HorizontalPositionRelativeFrom.PAGE,offset:0}, verticalPosition:{relative:VerticalPositionRelativeFrom.PAGE,offset:top*12700}, behindDocument:true, allowOverlap:true },
  });
  return {
    properties:{titlePage:false,page:{size:{width:12240,height:15840},margin:{top:2520,right:sideMargin,bottom:2560,left:sideMargin,header:0,footer:2280}}},
    headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,indent:{left:5000},spacing:{before:1100,after:0,line:260},children:[image(assets.encabezado,118.8,0),new TextRun({text:title,font:'Arial',bold:true,size:24,color:'061F3F'})]})]})},
    footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,spacing:{before:0,after:0,line:180},children:[image(assets.pie,108,684),new TextRun({children:[PageNumber.CURRENT,' / ',PageNumber.TOTAL_PAGES],font:'Arial',size:16,color:'061F3F'})]})]})},
  };
}
