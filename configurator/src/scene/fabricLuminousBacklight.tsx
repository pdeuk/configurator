import { ignoreRaycast } from "./raycast";
import {
    GLOW_COLOR,
    LUMINOUS_RECT_LIGHT_INTENSITY
} from "./fabricLuminous";

interface LuminousBacklightPlaneProps {
    panelWidth: number;
    panelHeight: number;
}

export function LuminousBacklightPlane({
    panelWidth,
    panelHeight
}: LuminousBacklightPlaneProps) {
    return (
        <rectAreaLight
            width={panelWidth * 0.92}
            height={panelHeight * 0.92}
            intensity={LUMINOUS_RECT_LIGHT_INTENSITY}
            color={GLOW_COLOR}
            position={[0, 0, -0.022]}
            rotation={[0, Math.PI, 0]}
            raycast={ignoreRaycast}
        />
    );
}

interface LuminousBacklightArcProps {
    radius: number;
    height: number;
    thetaStart: number;
    thetaLength: number;
}

export function LuminousBacklightArc({
    radius,
    height,
    thetaStart,
    thetaLength
}: LuminousBacklightArcProps) {
    const arcSpan = Math.max(Math.abs(thetaLength), 0.05);
    const midTheta = thetaStart + thetaLength / 2;

    return (
        <rectAreaLight
            width={radius * arcSpan * 1.6}
            height={height * 0.92}
            intensity={LUMINOUS_RECT_LIGHT_INTENSITY}
            color={GLOW_COLOR}
            position={[
                Math.sin(midTheta) * (radius - 0.022),
                0,
                -Math.cos(midTheta) * (radius - 0.022)
            ]}
            rotation={[0, midTheta + Math.PI, 0]}
            raycast={ignoreRaycast}
        />
    );
}
