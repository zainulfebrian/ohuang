import { registerPlugin } from '@capacitor/core';

export interface NativeDownloadPlugin {
    download(options: {
        filename: string;
        base64Data: string;
        mimeType: string;
    }): Promise<{ path: string }>;
}

const NativeDownload = registerPlugin<NativeDownloadPlugin>('NativeDownload');

export default NativeDownload;
