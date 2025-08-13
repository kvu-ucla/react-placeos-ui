// src/components/SessionDetails.tsx
export default function SessionDetails() {

    const currentClassName = "PSY101 - Introduction to Psychology"
    const nextClassName = "CS101 - Introduction to Computer Science"
    const remainingMinutes = 35;
    const isClass = true;
    const startTime = new Date().getTime();

    return (
        <div className="grid grid-cols-8 gap-4">
            {/* Session progress */}
            <div className="col-span-5 bg-white rounded-lg shadow justify-center p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-3xl font-bold">Session progress</h2>
                    {isClass && <div className="text-xl">Started at 2:00 PM • Ends at 3:50 PM</div>}
                </div>

                {isClass && <div className="w-full bg-gray-200 rounded-2xl overflow-hidden mb-4.5">
                    <div className="h-5 w-2/3 bg-blue-600"></div>
                </div>}
                <div className="flex items-center justify-between">
                    {isClass ? <div className="text-xl text-gray-500">65% Complete • 1:20 Elapsed</div> :
                        <div className="text-xl text-gray-500">Started at {startTime}</div>}
                    <div className="text-xl text-gray-500">
                        <span
                            className="text-blue-600 text-[30px] font-bold">{remainingMinutes}</span> {isClass ? "Minutes remaining" : "Minutes elapsed"}
                    </div>
                </div>
            </div>

            {/* Class info */}
            <div className="col-span-3 bg-white rounded-lg shadow px-9 py-6">
                <h2 className="truncate font-bold text-3xl mb-3">Current
                    class: {isClass ? currentClassName : "None"}</h2>
                {isClass ? <div className=" truncate text-blue-600 text-3xl font-bold mb-4">
                        Next up: {nextClassName}
                    </div>
                    :
                    <div className=" truncate  text-gray-500 font-bold text-2xl mb-4">
                        No classes after
                    </div>}
                {isClass && <div className="text-[24px]">Starts at 2:00 PM • Ends at 3:50 PM</div>}
            </div>
        </div>
    );
}
