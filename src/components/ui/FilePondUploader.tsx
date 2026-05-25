'use client';

import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { FilePondFile } from 'filepond';

// Register the plugins
registerPlugin(FilePondPluginImagePreview);

interface FilePondUploaderProps {
    files: any[];
    onUpdateFiles: (fileItems: FilePondFile[]) => void;
    allowMultiple?: boolean;
    maxFiles?: number;
    labelIdle?: string;
    className?: string;
    acceptedFileTypes?: string[];
}

export function FilePondUploader({
    files,
    onUpdateFiles,
    allowMultiple = false,
    maxFiles = 1,
    labelIdle = 'Drag & Drop your image or <span class="filepond--label-action">Browse</span>',
    className,
    acceptedFileTypes = ['image/*'],
}: FilePondUploaderProps) {
    return (
        <div className={className}>
            <FilePond
                files={files}
                onupdatefiles={onUpdateFiles}
                allowMultiple={allowMultiple}
                maxFiles={maxFiles}
                name="file"
                labelIdle={labelIdle}
                credits={false}
                acceptedFileTypes={acceptedFileTypes}
                storeAsFile={true}
            />
        </div>
    );
}
