import type { Position3, StandModule } from "../models/ModuleModel";


export type SnapAxis =
    "x" |
    "z";

export type SnapFace =
    "left" |
    "right" |
    "front" |
    "back";

export interface SnapResult {

    position:Position3;

    axis:SnapAxis;

    distance:number;

    moving:StandModule;

    target:StandModule;

    movingFace: SnapFace;
    targetFace: SnapFace;

    overlap:number;

    anchor:{
        movingFace: SnapFace;
        targetFace: SnapFace;
        axis: SnapAxis;
    };

}
