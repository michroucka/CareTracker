import React from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { Upload, X, User, FileX, Camera } from "lucide-react";
import { showToast } from "./MyToast.jsx";

/**
 * Image upload component with preview
 *
 * @param {Object} props
 * @param {File|string|null} props.value - Current image (File object or URL string)
 * @param {Function} props.onChange - Callback when image changes (receives File or null)
 * @param {boolean} props.isDisabled - Whether the upload is disabled
 * @param {boolean} props.isReadOnly - Whether in read-only mode
 * @param {string} props.label - Label for the upload area
 * @param {string} props.description - Description text
 * @param {boolean} props.isInvalid - Whether the field has an error
 * @param {string} props.errorMessage - Error message to display
 * @param {string} props.className - Additional CSS classes for the wrapper
 */
export function ImageUpload({
    value = null,
    onChange,
    isDisabled = false,
    isReadOnly = false,
    label = "Fotografie",
    description = "JPG, PNG, max 5 MB",
    isInvalid = false,
    errorMessage = "",
    className = "",
}) {
    const fileInputRef = React.useRef(null);
    const [preview, setPreview] = React.useState(null);
    const [dragActive, setDragActive] = React.useState(false);

    // Generate preview URL
    React.useEffect(() => {
        if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (typeof value === 'string' && value) {
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
                showToast({
                    title: "Neplatný formát souboru",
                    description: "Podporované formáty: JPG, PNG, GIF, WebP",
                    color: "danger",
                    icon: <FileX />
                });
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                showToast({
                    title: "Soubor je příliš velký",
                    description: `Velikost: ${sizeMB} MB. Maximum: 5 MB`,
                    color: "danger",
                    icon: <FileX />,
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
                showToast({
                    title: "Neplatný formát souboru",
                    description: "Podporované formáty: JPG, PNG, GIF, WebP",
                    color: "danger"
                });
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                showToast({
                    title: "Soubor je příliš velký",
                    description: `Velikost: ${sizeMB} MB. Maximum: 5 MB`,
                    color: "danger"
                });
                return;
            }
            onChange?.(file);
        }
    };

    const handleRemove = () => {
        onChange?.(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        if (!isDisabled && !isReadOnly) {
            fileInputRef.current?.click();
        }
    };

    if (isReadOnly && !preview) {
        return (
            <div className={`flex flex-col gap-2 ${className}`}>
                <span className="text-sm text-foreground-500">{label}</span>
                <span className="text-sm text-foreground">Bez fotografie</span>
            </div>
        );
    }

    if (isReadOnly && preview) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <img
                    src={preview}
                    alt="Client"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-default-200"
                />
                <span className="text-sm text-foreground-500">{label}</span>
            </div>
        );
    }

    return (
        <div className={`flex items-start gap-3 ${className}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isDisabled}
                className="hidden"
            />

            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className={`w-20 h-20 object-cover rounded-full border-2 ${isInvalid ? 'border-danger' : 'border-default-200'}`}
                    />
                    {!isDisabled && (
                        <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="solid"
                            className="absolute -top-1 -right-1 min-w-6 h-6 min-w-6 w-6 rounded-full"
                            onPress={handleRemove}
                        >
                            <X size={14} />
                        </Button>
                    )}
                </div>
            ) : (
                <div
                    onClick={handleClick}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`
                        w-20 h-20 flex items-center justify-center rounded-full border-2 border-dashed transition-all
                        ${dragActive ? 'border-primary bg-primary/10' : 'border-default-300'}
                        ${isInvalid ? 'border-danger' : ''}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-default-50'}
                    `}
                >
                    <Camera size={32} className="text-default-400" />
                </div>
            )}

            <div className="flex flex-col gap-1 flex-1">
                {label && (
                    <label className="text-sm font-medium text-foreground">
                        {label}
                    </label>
                )}
                <p className="text-xs text-default-500">
                    {description}
                </p>
                <Button
                    size="sm"
                    variant="flat"
                    className="w-fit mt-1"
                    startContent={<Upload size={14} />}
                    isDisabled={isDisabled}
                    onPress={handleClick}
                >
                    Vybrat soubor
                </Button>
                {isInvalid && errorMessage && (
                    <p className="text-xs text-danger mt-1">{errorMessage}</p>
                )}
            </div>
        </div>
    );
}
