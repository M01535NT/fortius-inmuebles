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
export const MinusCircle = adapt(I.MinusCircle, "MinusCircle");
export const Moon = adapt(I.HalfMoon, "HalfMoon");
export const MoreHorizontal = adapt(I.MoreHoriz, "MoreHoriz");
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
export const Film = adapt(I.MediaVideo, "MediaVideo");
export const ImageIcon = adapt(I.MediaImage, "MediaImage");
export const Link2 = adapt(I.Link, "Link");
export const Paperclip = adapt(I.Attachment, "Attachment");
