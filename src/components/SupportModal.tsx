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
        phone: '(800) 900-UCLA',
        href: 'tel:+18009008525',
    },
];

export default function SupportModal({onClose}: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'Contact' | 'Troubleshoot'>('Contact');

    return (
        
            <div className="modal modal-open bg-black/40">
                <div className="modal-box bg-white p-8 w-[1547px] h-[1098px] max-w-full rounded-lg">
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
                                    <div className="not-prose text-left text-base text-avit-grey-80">
                                        <h3 className="text-3xl font-semibold mb-4">Contact</h3>

                                        <div className="space-y-3">
                                            {contacts.map(({ title, description, phone, href }) => (
                                                <div
                                                    key={title}
                                                    className="flex items-start justify-between gap-6 rounded-lg border border-avit-grey bg-white p-12"
                                                >
                                                    <div className="flex-1">
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <span className="text-blue-600"><Info /></span>
                                                            <span className="font-semibold text-2xl leading-tight">{title}</span>
                                                        </div>
                                                        <p className="text-2xl leading-relaxed whitespace-pre-line text-gray-600">
                                                            {description}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-center text-4xl">
                                                        <a
                                                            href={href}
                                                            className="whitespace-nowrap text-blue-600 font-semibold text-right hover:underline"
                                                        >
                                                            {phone}
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 text-left">
                                            <div className="inline-flex items-center gap-2 rounded bg-gray-100 px-3 py-1 text-sm">
                                                <div className="h-4 w-4 rounded-full bg-green-500 mr-1 animate-pulse" />
                                                <span className="text-gray-700 text-base font-medium">All systems online</span>
                                            </div>
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
            
            {/* Optional: backdrop click closes modal */}
            <div className="modal-backdrop" onClick={() => onClose()} />
            </div>
    );
}
