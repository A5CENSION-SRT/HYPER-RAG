"use client";

interface ManageManualProps {
    productType: "washing_machine" | "refrigerator" | "ac";
}

export function ManageManual({ productType }: ManageManualProps) {
    const productNames = {
        washing_machine: "Washing Machine",
        refrigerator: "Refrigerator",
        ac: "Air Conditioner",
    };

    return (
        <div className="h-full p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Manage {productNames[productType]} Manual
                </h1>
                <p className="text-gray-600 mb-8">
                    View and manage manuals for {productNames[productType]}
                </p>

                <div className="text-center text-gray-500 mt-16">
                    <p>Manual management interface will be implemented here</p>
                </div>
            </div>
        </div>
    );
}
