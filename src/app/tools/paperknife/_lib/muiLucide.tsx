import React from "react";
import {
    Layers as LayersMUI,
    ContentCut,
    Bolt,
    Lock as LockMUI,
    LockOpen,
    Autorenew,
    SwapVert,
    Numbers,
    Title,
    LocalOffer,
    Draw,
    Palette as PaletteMUI,
    Image as ImageMUI,
    AddPhotoAlternate,
    Description,
    Build,
    KeyboardArrowLeft,
    Close,
    Add,
    Share,
    Download as DownloadMUI,
    CheckCircle,
    RestartAlt,
    GridView,
    OpenWith,
    Refresh,
    GppBad,
    Upload as UploadMUI,
    TaskAlt,
    Info as InfoMUI,
    Edit,
    AutoAwesome,
    Visibility,
    Check as CheckMUI,
    ContentCopy,
    ManageSearch,
    ArrowForward,
    DragIndicator,
    ChevronLeft as ChevronLeftMUI,
    ChevronRight as ChevronRightMUI,
    OpenInFull,
    InsertDriveFile,
    VerifiedUser
} from "@mui/icons-material";

type IconProps = {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
    strokeWidth?: number;
};

function wrap(IconComp: React.ElementType) {
    return ({ size = 24, className, style }: IconProps) => (
        <IconComp
            className={className}
            style={style}
            sx={{ fontSize: size }}
        />
    );
}

export const ArrowLeft = wrap(KeyboardArrowLeft);
export const Layers = wrap(LayersMUI);
export const Scissors = wrap(ContentCut);
export const Zap = wrap(Bolt);
export const Lock = wrap(LockMUI);
export const Unlock = wrap(LockOpen);
export const RotateCw = wrap(Autorenew);
export const RotateCcw = wrap(RestartAlt);
export const ArrowUpDown = wrap(SwapVert);
export const ArrowRight = wrap(ArrowForward);
export const Hash = wrap(Numbers);
export const Type = wrap(Title);
export const Tags = wrap(LocalOffer);
export const PenTool = wrap(Draw);
export const Palette = wrap(PaletteMUI);
export const FileImage = wrap(ImageMUI);
export const ImagePlus = wrap(AddPhotoAlternate);
export const Image = wrap(ImageMUI);
export const FileText = wrap(Description);
export const Wrench = wrap(Build);
export const X = wrap(Close);
export const Plus = wrap(Add);
export const Loader2 = wrap(Autorenew);
export const Share2 = wrap(Share);
export const Download = wrap(DownloadMUI);
export const CheckCircle2 = wrap(CheckCircle);
export const Grid = wrap(GridView);
export const Move = wrap(OpenWith);
export const RefreshCcw = wrap(Refresh);
export const RefreshCw = wrap(Refresh);
export const ShieldAlert = wrap(GppBad);
export const Upload = wrap(UploadMUI);
export const FileCheck = wrap(TaskAlt);
export const Info = wrap(InfoMUI);
export const Edit3 = wrap(Edit);
export const Sparkles = wrap(AutoAwesome);
export const Eye = wrap(Visibility);
export const Check = wrap(CheckMUI);
export const Copy = wrap(ContentCopy);
export const ScanSearch = wrap(ManageSearch);
export const GripVertical = wrap(DragIndicator);
export const ChevronLeft = wrap(ChevronLeftMUI);
export const ChevronRight = wrap(ChevronRightMUI);
export const Maximize2 = wrap(OpenInFull);
export const FileIcon = wrap(InsertDriveFile);
export const ShieldCheck = wrap(VerifiedUser);
