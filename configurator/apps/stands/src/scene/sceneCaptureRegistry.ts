export interface StandScenePreviewViews {
    front: string;
    top: string;
}

type SceneCaptureHandler = () => Promise<StandScenePreviewViews | null>;

let captureHandler: SceneCaptureHandler | null = null;

export function registerSceneCapture(handler: SceneCaptureHandler | null): void {
    captureHandler = handler;
}

export async function captureStandSceneViews(): Promise<StandScenePreviewViews | null> {
    if (!captureHandler) {
        return null;
    }

    return captureHandler();
}
