// src/components/SessionDetails.tsx
export default function SessionDetails() {
    
    const nextClassName = "CS101 - Introduction to Computer Science"
    const remainingMinutes = 35;
    return (
        <div className="grid grid-cols-8 gap-4 min-h-48">
            {/* Session progress */}
            <div className="col-span-5 bg-white rounded-lg shadow p-4 flex flex-col space-y-4 justify-center">
                <div className="p-2 flex items-center justify-between">
                    <h2 className="text-4xl font-semibold">Session progress</h2>
                    <div className="mt-2 text-xl">Started at 2:00 PM • Ends at 3:50 PM</div>
                </div>

                <div className="mt-1 w-full h-6 bg-gray-200 rounded-2xl overflow-hidden">
                    <div className="h-full w-2/3 bg-blue-600"></div>
                </div>
                <div className="flex justify-between p-2">
                    <div className="mt-1 text-xl text-gray-500">65% Complete • 1:20 Elapsed</div>
                    <div className="mt-1 text-xl text-gray-500">
                        <span className="text-blue-600 font-semibold">{remainingMinutes} minutes remaining</span>
                    </div>
                </div>
            </div>

            {/* Class info */}
            <div className="col-span-3 bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold text-4xl p-2">Current Class: Introduction to Psychology</h2>
                <div className="mt-1 text-blue-600 text-2xl p-2">
                    Next up: {nextClassName}
                </div>
                <div className="text-xl p-2">Starts at 2:00 PM • Ends at 3:50 PM</div>

            </div>
        </div>
    );
}
