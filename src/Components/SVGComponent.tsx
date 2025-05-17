import React from "react";

interface SvgComponentProps { 
    svgString: string;
    _class?: string;
    style?: React.CSSProperties;
    props?: any;
}
const SvgComponent = ({ svgString, _class, style, ...props }: SvgComponentProps) => {
    return (
        <div
            className={_class}
            style={style}
            dangerouslySetInnerHTML={{ __html: svgString as string }}
            {...props}
        />
    );
};

export default SvgComponent;