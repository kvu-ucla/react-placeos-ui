// src/components/SupportModal.tsx
import {useState} from 'react';
import {Info, XIcon} from "lucide-react";

interface ContactInfo {
    title: string;
    description: string;
    phone: string;
    href: string;
}

const contacts: ContactInfo[] = [
    {
        title: 'AV Technical Support',
        description: 'Immediate support line\nHours: 7am–11pm',
        phone: '(310) 206-6597',
        href: 'tel:+13102066597',
    },
    {
        title: 'Facilities Support',
        description: 'Hours: 9am–5pm\nWeekdays Only',
        phone: '(310) 825-9236',
        href: 'tel:+13108259236',
    },
    {
        title: 'Emergency Support',
        description: 'Crisis response hotline',
        phone: '1 (800) 900-UCLA',
        href: 'tel:+18009008525',
    },
];

export default function SupportModal({onClose}: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'Contact' | 'Troubleshoot'>('Contact');

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white min-w-[1200px] min-h-[800px] max-w-full rounded-lg shadow-xl p-6">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-avit-grey pb-8">
                    <h2 className="text-4xl font-semibold">Support</h2>
                    <button
                        onClick={onClose}
                    >
                        <XIcon className="h-8 w-8"/>
                    </button>
                </div>

                {/* Body */}
                <div className="flex mt-4">
                    {/* Sidebar tabs */}
                    <div className="w-1/4">
                        <div className="flex flex-col space-y-2">
                            {['Contact', 'Troubleshoot'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as 'Contact' | 'Troubleshoot')}
                                    className={`text-left px-6 py-4 rounded font-medium ${
                                        activeTab === tab
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="w-3/4 px-6">
                        {activeTab === 'Contact' && (
                            <>
                                <h3 className="text-3xl font-semibold mb-4">Contact</h3>
                                <div className="space-y-3">
                                    {contacts.map(({title, description, phone, href}) => (
                                        <div
                                            key={title}
                                            className="border border-avit-grey rounded-lg p-12 flex justify-between items-start bg-white"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center mb-1">
                                                    <span className="text-blue-600 mr-2"><Info/></span>
                                                    <span className="font-semibold">{title}</span>
                                                </div>
                                                <p className="text-xl whitespace-pre-line text-gray-600">
                                                    {description}
                                                </p>
                                            </div>
                                            <div className="flex-col h-full items-center justify-center">
                                                <a
                                                    href={href}
                                                    className="text-blue-600 font-semibold text-right hover:underline"
                                                >
                                                    {phone}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6">
                                    <div className="inline-flex items-center bg-gray-100 text-sm px-3 py-1 rounded">
                                        <div className="w-4 h-4 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                        <span className="text-gray-700 text-xl font-medium">All systems online</span>
                                    </div>
                                </div>
                            </>

                        )}
                        {activeTab === 'Troubleshoot' && (
                            <div className="text-gray-500 pt-4">
                                Troubleshooting content goes here…
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                {/*<div className="mt-6 px-2">*/}
                {/*    <div className="inline-flex items-center bg-gray-100 text-sm px-3 py-1 rounded">*/}
                {/*        <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>*/}
                {/*        <span className="text-gray-700 font-medium">All systems online</span>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </div>
        //     <div className="modal modal-open bg-black/40">
        //     <div className="modal-box bg-white p-8 min-w-[1200px] min-h-[800px] max-w-full rounded-lg">
        //         <div className="">
        //             {/* Header */}
        //             <div className="flex justify-between items-center border-b border-avit-grey pb-8">
        //                 <h2 className="text-4xl font-semibold">Settings</h2>
        //                 <button
        //                     onClick={onClose}
        //                     className="text-2xl font-bold "
        //                 >
        //                     <XIcon className="h-8 w-8"/>
        //                 </button>
        //             </div>
        //
        //             <div className="flex mt-4 space-x-6">
        //                 {/* Sidebar */}
        //                 <div className="w-1/4 space-y-2">
        //                     <Section label="Audio" tabs={audioTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        //                     <Section label="Video" tabs={videoTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        //                     <Section label="Meeting Controls" tabs={meetingTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        //                 </div>
        //
        //                 {/* Content */}
        //                 <div className="w-3/4 space-y-6">
        //                     {/*{activeTab === 'Volume' && (*/}
        //                     {/*    <>*/}
        //                     {/*        <div className="border border-color-[#99999] rounded-lg p-4">*/}
        //                     {/*            <h3 className="font-semibold mb-2">Speakers</h3>*/}
        //                     {/*            <div className="flex items-center justify-between">*/}
        //                     {/*                <Volume className="h-24 w-24"></Volume>*/}
        //                     {/*                <input type="range" className="range range-xl touch-none w-full mx-2" defaultValue={60} />*/}
        //                     {/*                <Volume2 className="h-24 w-24"></Volume2>*/}
        //                     {/*                <span className="text-sm text-blue-600 font-bold">60%</span>*/}
        //                     {/*                <button className="ml-4 bg-gray-100 px-4 py-2 rounded">Mute Mic</button>*/}
        //                     {/*            </div>*/}
        //                     {/*        </div>*/}
        //
        //                     {/*        <div>*/}
        //                     {/*            <h3 className="font-semibold mb-2">Microphones</h3>*/}
        //                     {/*            <div className="grid grid-cols-2 gap-4">*/}
        //                     {/*                {[1, 2, 3, 4].map((mic) => (*/}
        //                     {/*                    <MicControl key={mic} mic={mic} />*/}
        //                     {/*                ))}*/}
        //                     {/*            </div>*/}
        //                     {/*        </div>*/}
        //                     {/*    </>*/}
        //                     {/*)}*/}
        //                     {/* Other tabs can be added here */}
        //                     <div className="mt-6">
        //                         <div className="bg-blue-100 text-blue-900 p-3 text-xl rounded flex items-center justify-left">
        //                             <div className="flex items-center">
        //                                 <span className="mr-2"><Phone/></span>
        //                                 <span>
        //                             Need help? Call <strong>AV Technical Support</strong> for assistance:
        //                         </span>
        //                             </div>
        //                             <a href="tel:+13102066597" className="ml-2 font-bold hover:underline">
        //                                 (310) 206-6597
        //                             </a>
        //                         </div>
        //                     </div>
        //                 </div>
        //             </div>
        //
        //             {/* Footer */}
        //
        //         </div>
        //     </div>
        //     {/* Optional: backdrop click closes modal */}
        //     <div className="modal-backdrop" onClick={() => onClose()} />
        // </div>
    );
}
