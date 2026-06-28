import React from "react";
import { Button, toast } from "@heroui/react";
import { Upload, X, User, FileX, Camera } from "lucide-react";

/**
 * Image upload component with preview
 *
 * @param {Object} props
 * @param {File|string|null} props.value - Current image (File object or URL string)
 * @param {Function} props.onChange - Callback when image changes (receives File or null)
 * @param {boolean} props.isDisabled - Whether the upload is disabled
 * @param {boolean} props.isReadOnly - Whether in read-only mode
 * @param {string} props.label - Label for the upload area
 * @param {boolean} props.isInvalid - Whether the field has an error
 * @param {string} props.errorMessage - Error message to display
 * @param {string} props.className - Additional CSS classes for the wrapper
 */
export function ImageUpload({
    value = null,
    size = 32,
    iconSize,
    onChange,
    isDisabled = false,
    isReadOnly = false,
    label ,
    isInvalid = false,
    errorMessage = "",
    className = "",
}) {
    const fileInputRef = React.useRef(null);
    const [preview, setPreview] = React.useState(null);
    const [dragActive, setDragActive] = React.useState(false);

    // Calculate icon size based on component size if not explicitly provided
    const actualIconSize = iconSize ?? Math.round(size * 1.25);

    // Generate preview URL
    React.useEffect(() => {
        if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (typeof value === 'string' && value && value !== 'DELETE') {
            setPreview(value);
        } else {
            setPreview(null);
        }
    }, [value]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.danger("Neplatný formát souboru", {
                    description: "Podporované formáty: JPG, PNG, GIF, WebP",
                    indicator: <FileX />,
                });
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                toast.danger("Soubor je příliš velký", {
                    description: `Velikost: ${sizeMB} MB. Maximum: 5 MB`,
                    indicator: <FileX />,
                });
                return;
            }
            onChange?.(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (isDisabled || isReadOnly) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.danger("Neplatný formát souboru", {
                    description: "Podporované formáty: JPG, PNG, GIF, WebP",
                });
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                toast.danger("Soubor je příliš velký", {
                    description: `Velikost: ${sizeMB} MB. Maximum: 5 MB`,
                });
                return;
            }
            onChange?.(file);
        }
    };

    const handleRemove = () => {
        onChange?.("DELETE"); // Send special "DELETE" marker instead of null
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        if (!isDisabled && !isReadOnly) {
            fileInputRef.current?.click();
        }
    };

    if (isReadOnly) {
        return (
            <div className={`flex flex-col items-center gap-2 ${className}`}>
                {label && (
                    <label className="font-medium text-foreground">
                        {label}
                    </label>
                )}

                <div
                    className="rounded-full border-2 overflow-hidden border-default"
                    style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                >
                    {preview ? (
                        <img
                            src={preview}
                            alt="Client"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-default">
                            <Camera size={actualIconSize} className="text-muted" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center gap-2 ${className}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isDisabled}
                className="hidden"
            />

            {label && (
                <label className="font-medium text-foreground">
                    {label}
                </label>
            )}

            <div className="relative">
                <div
                    onClick={handleClick}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`
                        relative rounded-full overflow-hidden transition-all duration-300 ease-in-out group
                        ${isInvalid ? 'border-2 border-danger' : 'border-2 border-default'}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent'}
                    `}
                    style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                >
                    {preview ? (
                        <>
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            {!isDisabled && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                                    <Camera size={actualIconSize} className="text-white/50" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={`
                            w-full h-full flex items-center justify-center
                            ${dragActive ? 'bg-accent/10' : 'bg-default'}
                            transition-colors
                        `}>
                            <Camera size={actualIconSize} className="text-muted" />
                        </div>
                    )}
                </div>

                {preview && !isDisabled && (
                    <Button
                        isIconOnly
                        variant="danger-soft"
                        className="absolute -top-1 -right-1 min-w-6 h-6 w-6 rounded-full z-10"
                        onPress={handleRemove}
                    >
                        <X size={20} />
                    </Button>
                )}
            </div>

            {isInvalid && errorMessage && (
                <p className="text-xs text-danger">{errorMessage}</p>
            )}
        </div>
    );
}
