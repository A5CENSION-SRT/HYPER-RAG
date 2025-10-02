"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { uploadAndStream } from "@/lib/api/KnowledgeUpload";
type ProductType = "washing_machine" | "refrigerator" | "ac";

export function AddManuals() {
    // --- STATE CHANGE: From array to single file or null ---
    const [selectedProduct, setSelectedProduct] = useState<ProductType | "">("");
    const [file, setFile] = useState<File | null>(null); // Changed from files: File[]
    
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

    // --- LOGIC CHANGE: Handle only the first valid file dropped ---
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");

        if (droppedFiles.length > 0) {
            if (droppedFiles.length > 1) {
                toast.info("Only one file can be uploaded at a time. Using the first file.");
            }
            setFile(droppedFiles[0]); // Set only the first file
        }
    }, []);

    // --- LOGIC CHANGE: Handle a single file from the input ---
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]); // Set only the first file
        }
    };

    // --- LOGIC CHANGE: Simpler function to clear the file state ---
    const removeFile = () => {
        setFile(null);
    };

    // --- LOGIC CHANGE: Removed the loop, simplified logic for one file ---
    const handleUpload = async () => {
        if (!selectedProduct) {
            toast.warning("Please select a product type.");
            return;
        }
        if (!file) {
            toast.warning("Please select a PDF file to upload.");
            return;
        }

        setIsUploading(true);

        const toastId = toast.loading(`Starting upload for ${file.name}...`);
        let hasError = false;

        try {
            await uploadAndStream(file, selectedProduct, {
                onMessage: (data) => {
                    toast.loading(data.message, { id: toastId });
                    if (data.status === 'error') hasError = true;
                },
                onError: (error) => {
                    hasError = true;
                    toast.error(`Error with ${file.name}: ${error.message}`, { id: toastId });
                },
                onComplete: () => {
                    if (!hasError) {
                        toast.success(`${file.name} processed successfully!`, { id: toastId });
                    }
                },
            });
        } catch (e) {
            toast.error(`A critical error occurred uploading ${file.name}`, { id: toastId });
        }

        setIsUploading(false);
        setFile(null); // Clear the file after the process is finished
    };

    return (
        <div className="h-full p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Manual</h1>
                <p className="text-gray-600 mb-8">
                    Upload a single PDF manual for a selected product.
                </p>

                {/* Product Selector (Unchanged) */}
                <div className="mb-6">
                    {/* ... your existing select code ... */}
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value as ProductType)}
                        disabled={isUploading}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer text-gray-900 font-medium disabled:opacity-50"
                    >
                        <option value="">Choose a product...</option>
                        <option value="washing_machine">Washing Machine</option>
                        <option value="refrigerator">Refrigerator</option>
                        <option value="ac">Air Conditioner</option>
                    </select>
                </div>

                {/* Drag and Drop Area */}
                <div
                    onDragOver={isUploading ? undefined : handleDragOver}
                    onDragLeave={isUploading ? undefined : handleDragLeave}
                    onDrop={isUploading ? undefined : handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${isUploading ? 'bg-gray-200 cursor-not-allowed' : isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                >
                    {/* --- JSX CHANGE: Removed 'multiple' attribute --- */}
                    <input type="file" id="file-input" accept=".pdf" onChange={handleFileInput} className="hidden" disabled={isUploading} />
                    <div className="flex flex-col items-center">
                        <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-200'}`}>
                            <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Drop a PDF file here
                        </h3>
                        <p className="text-gray-600 mb-4">or</p>
                        <label htmlFor="file-input" className={`px-6 py-3 rounded-lg font-medium transition-colors ${isUploading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'}`}>
                            Browse File
                        </label>
                    </div>
                </div>

                {/* --- JSX CHANGE: Replaced file list with single file display --- */}
                {file && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Selected File
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-red-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={removeFile}
                                disabled={isUploading}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={!selectedProduct || !file || isUploading}
                        className="px-8 py-3 rounded-lg font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {isUploading ? "Processing..." : "Upload Manual"}
                    </button>
                </div>
            </div>
        </div>
    );
}