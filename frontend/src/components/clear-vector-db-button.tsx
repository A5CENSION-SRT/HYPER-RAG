"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { fontClasses } from "@/lib/fonts";

interface ClearVectorDBButtonProps {
    isCollapsed?: boolean;
}

export function ClearVectorDBButton({ isCollapsed = false }: ClearVectorDBButtonProps) {
    const [isClearing, setIsClearing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleClearDatabase = async () => {
        setIsClearing(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const url = `${baseUrl}/api/v1/knowledge/vector-db/clear`;

            console.log(`Calling endpoint: ${url}`);

            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log(`Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Response error: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log("Vector databases cleared:", result);

            // Show success message
            alert(`Success! Cleared: ${result.deleted.join(", ")}`);

            setIsOpen(false);
        } catch (error) {
            console.error("Error clearing vector databases:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            alert(`Failed to clear vector databases: ${errorMessage}`);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <button
                    className="
            w-full relative overflow-hidden
            transition-all duration-200
            text-red-400 hover:bg-red-950 hover:text-red-300
            border border-red-800 hover:border-red-600
          "
                    style={{
                        borderRadius: '12px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    title={isCollapsed ? "Clear Vector DB" : undefined}
                >
                    <div className="w-11 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <div
                        className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1 ml-3'
                            }`}
                        style={{ textAlign: 'left' }}
                    >
                        <span className={`${fontClasses.navItem} block`}>Clear Vector DB</span>
                    </div>
                </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white text-xl">
                        Clear All Vector Databases?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                        This action cannot be undone. This will permanently delete all data from the following databases:
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* List outside of AlertDialogDescription to avoid hydration error */}
                <div className="px-6 pb-2">
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                        <li>AC Database</li>
                        <li>Washing Machine Database</li>
                        <li>Refrigerator Database</li>
                    </ul>
                    <p className="mt-3 font-semibold text-red-400">
                        All uploaded manuals and embeddings will be removed.
                    </p>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel
                        className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
                        disabled={isClearing}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleClearDatabase}
                        disabled={isClearing}
                        className="bg-red-600 text-white hover:bg-red-700"
                    >
                        {isClearing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Clearing...
                            </>
                        ) : (
                            "Clear All Databases"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
