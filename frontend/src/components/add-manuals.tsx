"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";

type ProductType = "washing_machine" | "refrigerator" | "ac";

export function AddManuals() {
    const [selectedProduct, setSelectedProduct] = useState<ProductType | "">("");
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

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

        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            (file) => file.type === "application/pdf"
        );

        setFiles((prev) => [...prev, ...droppedFiles]);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(
                (file) => file.type === "application/pdf"
            );
            setFiles((prev) => [...prev, ...selectedFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = () => {
        if (!selectedProduct) {
            alert("Please select a product type");
            return;
        }
        if (files.length === 0) {
            alert("Please add at least one PDF file");
            return;
        }

        // TODO: Implement backend upload
        console.log("Uploading files:", files, "for product:", selectedProduct);
        alert(`Ready to upload ${files.length} file(s) for ${selectedProduct}`);
    };

    return (
        <div className="h-full p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Manuals</h1>
                <p className="text-gray-600 mb-8">
                    Upload PDF manuals for your products
                </p>

                {/* Product Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Product Type
                    </label>
                    <div className="relative">
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value as ProductType)}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer text-gray-900 font-medium"
                        >
                            <option value="">Choose a product...</option>
                            <option value="washing_machine">Washing Machine</option>
                            <option value="refrigerator">Refrigerator</option>
                            <option value="ac">Air Conditioner</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                            <svg
                                className="fill-current h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Drag and Drop Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
            ${isDragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        }
          `}
                >
                    <input
                        type="file"
                        id="file-input"
                        multiple
                        accept=".pdf"
                        onChange={handleFileInput}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center">
                        <div className={`
              p-4 rounded-full mb-4 transition-colors
              ${isDragging ? "bg-blue-100" : "bg-gray-200"}
            `}>
                            <Upload className={`w-12 h-12 ${isDragging ? "text-blue-600" : "text-gray-500"}`} />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Drop PDF files here
                        </h3>
                        <p className="text-gray-600 mb-4">or</p>
                        <label
                            htmlFor="file-input"
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                        >
                            Browse Files
                        </label>
                        <p className="text-sm text-gray-500 mt-4">
                            Supported format: PDF only
                        </p>
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Selected Files ({files.length})
                        </h3>
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                                >
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
                                        onClick={() => removeFile(index)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={!selectedProduct || files.length === 0}
                        className={`
              px-8 py-3 rounded-lg font-semibold text-white transition-all
              ${selectedProduct && files.length > 0
                                ? "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                                : "bg-gray-400 cursor-not-allowed"
                            }
            `}
                    >
                        Upload Manuals
                    </button>
                </div>
            </div>
        </div>
    );
}
