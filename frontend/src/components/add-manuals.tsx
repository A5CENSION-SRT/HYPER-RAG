"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadAndStream } from "@/lib/api/KnowledgeUpload";

type ProductType = "washing_machine" | "refrigerator" | "air_conditioner";

type UploadStatus = "pending" | "processing" | "completed" | "error";

interface FileQueueItem {
    id: string;
    file: File;
    productType: ProductType;
    status: UploadStatus;
    progress: string[];
    errorMessage?: string;
}

export function AddManuals() {
    const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const processingRef = useRef(false); // Prevent duplicate processing

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");

        if (droppedFiles.length > 0) {
            addFilesToQueue(droppedFiles);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            addFilesToQueue(selectedFiles);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const addFilesToQueue = (files: File[]) => {
        const newItems: FileQueueItem[] = files.map(file => ({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            productType: "washing_machine", // Default product type
            status: "pending",
            progress: [],
        }));

        setFileQueue(prev => [...prev, ...newItems]);
        toast.success(`Added ${files.length} file(s) to queue`);
    };

    const removeFileFromQueue = (id: string) => {
        setFileQueue(prev => prev.filter(item => item.id !== id));
    };

    const updateFileProductType = (id: string, productType: ProductType) => {
        setFileQueue(prev => prev.map(item =>
            item.id === id ? { ...item, productType } : item
        ));
    };

    const processQueue = async () => {
        if (processingRef.current) return; // Already processing
        processingRef.current = true;
        setIsProcessing(true);

        const pendingItems = fileQueue.filter(item => item.status === "pending");

        if (pendingItems.length === 0) {
            toast.info("No pending files to process");
            processingRef.current = false;
            setIsProcessing(false);
            return;
        }

        const totalFiles = pendingItems.length;
        let completedCount = 0;

        for (const item of pendingItems) {
            const currentFileNumber = completedCount + 1;

            // Update status to processing
            setFileQueue(prev => prev.map(i =>
                i.id === item.id ? { ...i, status: "processing", progress: [] } : i
            ));

            // Show starting toast with file counter
            toast.info(`Processing ${item.file.name} (${currentFileNumber}/${totalFiles})...`);

            let hasError = false;
            let uploadCompleted = false;

            try {
                await uploadAndStream(item.file, item.productType, {
                    onMessage: (data) => {
                        // Show progress as toasts instead of storing in progress array
                        if (data.status === 'error') {
                            hasError = true;
                            toast.error(data.message);
                            setFileQueue(prev => prev.map(i =>
                                i.id === item.id ? { ...i, status: "error", errorMessage: data.message } : i
                            ));
                        } else if (data.status === 'complete') {
                            uploadCompleted = true;
                            setFileQueue(prev => prev.map(i =>
                                i.id === item.id ? { ...i, status: "completed" } : i
                            ));
                        } else {
                            // Show processing messages as info toasts
                            toast.info(data.message);
                        }
                    },
                    onError: (error) => {
                        hasError = true;
                        setFileQueue(prev => prev.map(i =>
                            i.id === item.id
                                ? { ...i, status: "error", errorMessage: error.message }
                                : i
                        ));
                        toast.error(`Error processing ${item.file.name}: ${error.message}`);
                    },
                    onComplete: () => {
                        if (!hasError && uploadCompleted) {
                            completedCount++;
                            // Show completion toast with counter
                            toast.success(`✓ ${item.file.name} completed! (${completedCount}/${totalFiles})`);
                        }
                    },
                });
            } catch (e) {
                hasError = true;
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                setFileQueue(prev => prev.map(i =>
                    i.id === item.id
                        ? { ...i, status: "error", errorMessage }
                        : i
                ));
                toast.error(`Critical error uploading ${item.file.name}: ${errorMessage}`);
            }

            // Small delay between uploads to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        processingRef.current = false;
        setIsProcessing(false);

        // Final completion message
        if (completedCount === totalFiles) {
            toast.success(`All ${totalFiles} files processed successfully!`);
        } else {
            toast.warning(`Completed ${completedCount}/${totalFiles} files. Some files had errors.`);
        }
    };

    const getStatusIcon = (status: UploadStatus) => {
        switch (status) {
            case "pending":
                return <Clock className="w-5 h-5 text-gray-400" />;
            case "processing":
                return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            case "completed":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "error":
                return <AlertCircle className="w-5 h-5 text-red-500" />;
        }
    };

    const getStatusColor = (status: UploadStatus) => {
        switch (status) {
            case "pending":
                return "bg-gray-100 border-gray-300";
            case "processing":
                return "bg-blue-50 border-blue-300";
            case "completed":
                return "bg-green-50 border-green-300";
            case "error":
                return "bg-red-50 border-red-300";
        }
    };

    const clearCompletedFiles = () => {
        setFileQueue(prev => prev.filter(item => item.status !== "completed"));
        toast.info("Cleared completed files");
    };

    return (
        <div className="h-full p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Manuals</h1>
                        <p className="text-gray-600">
                            Upload PDF manuals in batch. Files will be processed sequentially.
                        </p>
                    </div>
                    {fileQueue.length > 0 && (
                        <button
                            onClick={clearCompletedFiles}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Clear Completed
                        </button>
                    )}
                </div>

                {/* Drag and Drop Area */}
                <div
                    onDragOver={isProcessing ? undefined : handleDragOver}
                    onDragLeave={isProcessing ? undefined : handleDragLeave}
                    onDrop={isProcessing ? undefined : handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${isProcessing
                            ? 'bg-gray-200 cursor-not-allowed'
                            : isDragging
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        id="file-input"
                        accept=".pdf"
                        multiple
                        onChange={handleFileInput}
                        className="hidden"
                        disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center">
                        <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-200'
                            }`}>
                            <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-600' : 'text-gray-500'
                                }`} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Drop PDF files here
                        </h3>
                        <p className="text-gray-600 mb-4">Support for multiple files</p>
                        <label
                            htmlFor="file-input"
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${isProcessing
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                                }`}
                        >
                            Browse Files
                        </label>
                    </div>
                </div>

                {/* File Queue */}
                {fileQueue.length > 0 && (
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Upload Queue ({fileQueue.length} files)
                            </h3>
                            <button
                                onClick={processQueue}
                                disabled={isProcessing || fileQueue.every(f => f.status !== "pending")}
                                className="px-6 py-2 rounded-lg font-medium text-white transition-all bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                {isProcessing ? "Processing..." : "Start Upload"}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {fileQueue.map((item) => (
                                <div
                                    key={item.id}
                                    className={`border-2 rounded-lg p-4 transition-all ${getStatusColor(item.status)}`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start space-x-3 flex-1">
                                            {getStatusIcon(item.status)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3">
                                                    <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {item.file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 whitespace-nowrap">
                                                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>

                                                {/* Product Type Selector */}
                                                <div className="mt-2">
                                                    <select
                                                        value={item.productType}
                                                        onChange={(e) => updateFileProductType(item.id, e.target.value as ProductType)}
                                                        disabled={item.status !== "pending"}
                                                        className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="washing_machine">Washing Machine</option>
                                                        <option value="refrigerator">Refrigerator</option>
                                                        <option value="air_conditioner">Air Conditioner</option>
                                                    </select>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="mt-2">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === "pending" ? "bg-gray-200 text-gray-800" :
                                                            item.status === "processing" ? "bg-blue-200 text-blue-800" :
                                                                item.status === "completed" ? "bg-green-200 text-green-800" :
                                                                    "bg-red-200 text-red-800"
                                                        }`}>
                                                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {item.status === "pending" && (
                                            <button
                                                onClick={() => removeFileFromQueue(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Error Message */}
                                    {item.status === "error" && item.errorMessage && (
                                        <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-500 rounded">
                                            <p className="text-sm text-red-700 font-medium">
                                                ❌ {item.errorMessage}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {fileQueue.length === 0 && (
                    <div className="mt-8 text-center py-12">
                        <p className="text-gray-500">No files in queue. Add files to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}