"use client";
import * as React from "react";
import * as I from "iconoir-react";

/*
  Íconos del panel: Iconoir (MIT), elegido por el titular el 18/10/2026 entre tres propuestas
  (trazo fino de 1.5, geometría abierta). Este archivo conserva los nombres que el panel ya
  usaba con lucide, para que las pantallas no cambien de código: cada export es el ícono de
  Iconoir equivalente con la misma interfaz (`size`, `strokeWidth`, `className`, `aria-hidden`).
  El sitio público sigue con lucide.
*/

type IconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number | string; strokeWidth?: number | string };
type IconoirComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>;

function adapt(Component: IconoirComponent, name: string) {
  const Icon = ({ size = 24, strokeWidth = 1.5, ...rest }: IconProps) => <Component width={size} height={size} strokeWidth={strokeWidth} {...rest} />;
  Icon.displayName = `Icon(${name})`;
  return Icon;
}

export const AlertCircle = adapt(I.WarningCircle, "WarningCircle");
export const AlertTriangle = adapt(I.WarningTriangle, "WarningTriangle");
export const ArrowDown = adapt(I.ArrowDown, "ArrowDown");
export const ArrowLeft = adapt(I.ArrowLeft, "ArrowLeft");
export const ArrowLeftRight = adapt(I.DataTransferBoth, "DataTransferBoth");
export const ArrowRight = adapt(I.ArrowRight, "ArrowRight");
export const ArrowUp = adapt(I.ArrowUp, "ArrowUp");
export const ArrowUpRight = adapt(I.ArrowUpRight, "ArrowUpRight");
export const BookOpenCheck = adapt(I.OpenBook, "OpenBook");
export const Building2 = adapt(I.Building, "Building");
export const CalendarDays = adapt(I.Calendar, "Calendar");
export const CalendarPlus = adapt(I.CalendarPlus, "CalendarPlus");
export const ChartNoAxesCombined = adapt(I.StatsReport, "StatsReport");
export const Check = adapt(I.Check, "Check");
export const CheckCircle2 = adapt(I.CheckCircle, "CheckCircle");
export const ChevronDown = adapt(I.NavArrowDown, "NavArrowDown");
export const ChevronLeft = adapt(I.NavArrowLeft, "NavArrowLeft");
export const ChevronRight = adapt(I.NavArrowRight, "NavArrowRight");
export const Circle = adapt(I.Circle, "Circle");
export const CircleDashed = adapt(I.Circle, "Circle");
export const CircleDot = adapt(I.Circle, "Circle");
export const CircleHelp = adapt(I.HelpCircle, "HelpCircle");
export const ClipboardCheck = adapt(I.ClipboardCheck, "ClipboardCheck");
export const ClipboardList = adapt(I.TaskList, "TaskList");
export const Clock = adapt(I.Clock, "Clock");
export const Columns3 = adapt(I.KanbanBoard, "KanbanBoard");
export const Contact = adapt(I.Community, "Community");
export const ExternalLink = adapt(I.OpenNewWindow, "OpenNewWindow");
export const Calculator = adapt(I.Calculator, "Calculator");
export const Eye = adapt(I.Eye, "Eye");
export const EyeOff = adapt(I.EyeClosed, "EyeClosed");
export const FileDiff = adapt(I.GitCompare, "GitCompare");
export const FileDown = adapt(I.Download, "Download");
export const FileText = adapt(I.Page, "Page");
export const Files = adapt(I.MultiplePages, "MultiplePages");
export const GitCompareArrows = adapt(I.GitCompare, "GitCompare");
export const Hammer = adapt(I.Hammer, "Hammer");
export const HandCoins = adapt(I.HandCash, "HandCash");
export const History = adapt(I.ClockRotateRight, "ClockRotateRight");
export const House = adapt(I.Home, "Home");
export const Key = adapt(I.Key, "Key");
export const Image = adapt(I.MediaImage, "MediaImage");
export const Info = adapt(I.InfoCircle, "InfoCircle");
export const Landmark = adapt(I.Bank, "Bank");
export const LayoutGrid = adapt(I.ViewGrid, "ViewGrid");
export const List = adapt(I.List, "List");
export const ListChecks = adapt(I.TaskList, "TaskList");
export const LogOut = adapt(I.LogOut, "LogOut");
export const Mail = adapt(I.Mail, "Mail");
export const MapPin = adapt(I.MapPin, "MapPin");
export const Menu = adapt(I.Menu, "Menu");
export const MessageCircle = adapt(I.ChatBubble, "ChatBubble");
export const Mic = adapt(I.Microphone, "Microphone");
export const MinusCircle = adapt(I.MinusCircle, "MinusCircle");
export const Moon = adapt(I.HalfMoon, "HalfMoon");
export const MoreHorizontal = adapt(I.MoreHoriz, "MoreHoriz");
export const Paste = adapt(I.PasteClipboard, "PasteClipboard");
export const Pencil = adapt(I.EditPencil, "EditPencil");
export const Phone = adapt(I.Phone, "Phone");
export const PlayCircle = adapt(I.Play, "Play");
export const Plus = adapt(I.Plus, "Plus");
export const QrCode = adapt(I.QrCode, "QrCode");
export const ReceiptText = adapt(I.ReceiveDollars, "ReceiveDollars");
export const RotateCcw = adapt(I.Undo, "Undo");
export const Route = adapt(I.MapsArrow, "MapsArrow");
export const Save = adapt(I.FloppyDisk, "FloppyDisk");
export const Scale = adapt(I.GitCompare, "GitCompare");
export const ScanText = adapt(I.Scanning, "Scanning");
export const Search = adapt(I.Search, "Search");
export const Settings2 = adapt(I.Settings, "Settings");
export const ShieldCheck = adapt(I.ShieldCheck, "ShieldCheck");
export const Signature = adapt(I.EditPencil, "EditPencil");
export const Star = adapt(I.Star, "Star");
export const Sun = adapt(I.SunLight, "SunLight");
export const Trash2 = adapt(I.Trash, "Trash");
export const TrendingUp = adapt(I.GraphUp, "GraphUp");
export const UserRound = adapt(I.User, "User");
export const UserRoundCheck = adapt(I.UserBadgeCheck, "UserBadgeCheck");
export const UserPlus = adapt(I.UserPlus, "UserPlus");
export const Wallet = adapt(I.Wallet, "Wallet");
export const X = adapt(I.Xmark, "Xmark");
export const Camera = adapt(I.Camera, "Camera");
export const Upload = adapt(I.Upload, "Upload");
export const Folder = adapt(I.Folder, "Folder");
export const ZoomIn = adapt(I.ZoomIn, "ZoomIn");
export const ZoomOut = adapt(I.ZoomOut, "ZoomOut");
export const Film = adapt(I.MediaVideo, "MediaVideo");
export const ImageIcon = adapt(I.MediaImage, "MediaImage");
export const Link2 = adapt(I.Link, "Link");
export const Paperclip = adapt(I.Attachment, "Attachment");

/*
  Catálogo LV-02 (V01, aprobado por el titular el 13/11/2026 sobre el boceto): un ícono por etapa
  y por tipo de documento, el mismo en todas las pantallas. El documento usa el ícono de la etapa
  que lo deja (entrevista 02, levantamiento 04, dictamen 06, opinión de valor 07, contrato 09…).
*/
export type PanelIcon = ReturnType<typeof adapt>;
const STAGE = {
  prospecto: adapt(I.PhoneIncome, "PhoneIncome"),
  captacion: adapt(I.ChatLines, "ChatLines"),
  levantamiento: adapt(I.RulerCombine, "RulerCombine"),
  documentos: adapt(I.ClipboardCheck, "ClipboardCheck"),
  dictamen: adapt(I.ShieldCheck, "ShieldCheck"),
  verificacion: adapt(I.Coins, "Coins"),
  contrato: adapt(I.PageEdit, "PageEdit"),
  publicacion: adapt(I.Megaphone, "Megaphone"),
  visitas: adapt(I.Eye, "Eye"),
  cierre: adapt(I.Key, "Key"),
} as const;
/** Ícono de cada una de las diez etapas del propietario (venta y renta comparten claves). */
export const OWNER_STAGE_ICONS: Record<keyof typeof STAGE, PanelIcon> = STAGE;
/** Etapas de las demás rutas (comprador, arrendatario, inversión), por etapa del flujo. */
export const ROUTE_STAGE_ICONS: Record<string, PanelIcon> = {
  captacion: STAGE.captacion, documentacion: STAGE.documentos, comercializacion: adapt(I.Search, "Search"),
  negociacion: adapt(I.HandCash, "HandCash"), cierre: STAGE.contrato, entrega: STAGE.cierre, postventa: adapt(I.ChatBubbleCheck, "ChatBubbleCheck"),
};
const DOC: Record<string, PanelIcon> = {
  "01": adapt(I.Lock, "Lock"), "02": STAGE.captacion, "03": adapt(I.StatsReport, "StatsReport"), "04": STAGE.levantamiento,
  "05": adapt(I.DocMagnifyingGlass, "DocMagnifyingGlass"), "06": STAGE.dictamen, "07": STAGE.verificacion, "08": adapt(I.Calculator, "Calculator"),
  "09": STAGE.contrato, "10": adapt(I.TaskList, "TaskList"), "11": adapt(I.StatsReport, "StatsReport"), "12": adapt(I.UserCircle, "UserCircle"),
  "13": STAGE.visitas, "14": ROUTE_STAGE_ICONS.negociacion, "15": adapt(I.PageStar, "PageStar"), "16": STAGE.cierre,
  "17": adapt(I.BadgeCheck, "BadgeCheck"), "18": adapt(I.Wallet, "Wallet"), "19": adapt(I.Hammer, "Hammer"), "20": adapt(I.HomeSimpleDoor, "HomeSimpleDoor"),
  "21": STAGE.contrato,
};
const DOC_FALLBACK = adapt(I.Page, "Page");
/** Ícono del tipo de documento por su formato («04B» usa el del levantamiento). */
export function docIcon(formato: string): PanelIcon { return DOC[formato] ?? DOC[formato.slice(0, 2)] ?? DOC_FALLBACK; }

/*
  Estados de un requisito (V03): cada uno con forma propia, además de color y palabra.
  Pendiente círculo vacío, Lo tengo medio lleno, Revisado lleno con palomita, Hay un problema
  triángulo, No aplica punteado con raya. Mismo trazo de 1.5 que Iconoir.
*/
type GlyphProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number | string };
const glyph = (name: string, body: React.ReactNode) => {
  const Glyph = ({ size = 24, ...rest }: GlyphProps) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>{body}</svg>;
  Glyph.displayName = `Glyph(${name})`;
  return Glyph;
};
export const StatePending = glyph("Pendiente", <circle cx="12" cy="12" r="9" />);
export const StateHalf = glyph("LoTengo", <><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" /></>);
export const StateDone = glyph("Revisado", <><circle cx="12" cy="12" r="9.75" fill="currentColor" stroke="none" /><path d="M7.5 12.5l3 3 6-6.5" stroke="var(--card, #fff)" strokeWidth={2} /></>);
export const StateProblem = glyph("Problema", <><path d="M12 3.5 21.5 20h-19z" /><path d="M12 10v4.5M12 17.2v.1" strokeWidth={2} /></>);
export const StateNotApplicable = glyph("NoAplica", <><circle cx="12" cy="12" r="9" strokeDasharray="2.6 2.6" strokeLinecap="butt" /><path d="M8 12h8" /></>);

const ROUTE_ORDER = ["captacion", "documentacion", "comercializacion", "negociacion", "cierre", "entrega", "postventa"] as const;
/** Ícono de una etapa del avance: por su clave si es del propietario; si no, por su lugar en la ruta. */
export function stageIcon(stage: { key?: string } | undefined, index: number): PanelIcon {
  return (stage?.key && OWNER_STAGE_ICONS[stage.key as keyof typeof OWNER_STAGE_ICONS]) || ROUTE_STAGE_ICONS[ROUTE_ORDER[index] ?? "postventa"];
}
