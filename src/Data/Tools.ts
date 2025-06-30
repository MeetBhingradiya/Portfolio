import type { IBookmark } from "@App/Tools/Settings/Types";
import { v4 as uuidv4 } from "uuid";
import React from "react";
import { imageResolver } from "@Utils/ImageResolver";
import {
    Search,
    Fingerprint,
    QrCode2,
    DataObject,
    Colorize,
    Palette,
    TextFields,
    Extension,
    DescriptionOutlined,
    Security,
    LinkOutlined,
    Code,
    Password,
    CalendarMonth,
    Key
} from "@mui/icons-material";

export function ResolveIcon(link: IBookmark) {
    // Check if this bookmark has a dynamic icon template
    if (link.isDynamicIcon && link.iconTemplate) {
        try {
            return imageResolver.resolveVariables(link.iconTemplate);
        } catch (error) {
            console.warn(`Failed to resolve dynamic icon for bookmark "${link.Name}":`, error);
            // Fall back to static icon or default
        }
    }

    // Use static icon or fallback to favicon service
    const iconUrl = link.Icon
        ? link.Icon
        : `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${link.WebLink}&size=128`;

    return iconUrl;
}