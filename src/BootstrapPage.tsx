import {PlaceSystem, querySystems} from '@placeos/ts-client';
import {useCallback, useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {lastValueFrom} from 'rxjs';
import './BootstrapPage.css'; // We'll create this file for styles
import {useDebounce} from './useDebounce'; // Import the custom hook

const STORE_KEY = 'PLACEOS.CONTROL.system';

function BootstrapPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // State management using useState
    const [loading, setLoading] = useState(''); // 'Checks', 'search', 'Setup', or ''
    const [system_id, setSystemId] = useState('');
    const [space_list, setSpaceList] = useState([] as PlaceSystem[]);

    // Debounce the search input
    const debouncedSearchTerm = useDebounce(system_id, 300);

    // --- Logic and Data Fetching ---

    const configure = useCallback(
        (id: string) => {
            setLoading('Setup');
            if (localStorage) {
                localStorage.setItem(STORE_KEY, id);
                localStorage.setItem('trust', 'true');
                localStorage.setItem('fixed_device', 'true');
            }

            // In a real app, you might have different routes
            navigate(`/tabbed/${id}`, {replace: true});
        },
        [navigate],
    );

    const bootstrap = () => {
        if (system_id) configure(system_id);
    };

    // Effect for checking bootstrapped state and query params on mount
    useEffect(() => {
        const checkBootstrapped = () => {
            setLoading('Checks');
            if (localStorage) {
                const savedSystemId = localStorage.getItem(STORE_KEY);
                if (savedSystemId) {
                    navigate(`/tabbed/${savedSystemId}`, {replace: true});
                    return;
                }
            }
            setLoading('');
        };

        if (searchParams.get('clear')) {
            localStorage.removeItem(STORE_KEY);
        }

        const routeSystemId =
            searchParams.get('system_id') || searchParams.get('sys_id');
        if (routeSystemId) {
            configure(routeSystemId);
        } else {
            checkBootstrapped();
        }
    }, [navigate, searchParams, configure]);

    // Effect for fetching systems based on the debounced search term
    useEffect(() => {
        if (debouncedSearchTerm.length < 2) {
            setSpaceList([]);
            return;
        }

        const fetchSpaces = async () => {
            setLoading('search');
            try {
                // In a real app, you might get the org ID from a context or service hook
                const response = await lastValueFrom(
                    querySystems({
                        q: debouncedSearchTerm,
                        limit: 20,
                        fields: 'id,name,display_name,email',
                    }),
                );
                setSpaceList(response.data);
            } catch (error) {
                console.error('Failed to fetch systems:', error);
                setSpaceList([]); // Clear list on error
            } finally {
                setLoading('');
            }
        };

        fetchSpaces();
    }, [debouncedSearchTerm]);

    // --- Render Logic (JSX) ---

    const showForm = !loading || loading === 'search';

    return (
        <div className="bootstrap-container">
            <div
                className="m-4 mx-auto flex flex-col items-center overflow-hidden rounded-lg border border-gray-300 bg-white text-center shadow-md">
                <h2 className="m-0 w-full bg-red-500 px-4 py-2 text-2xl text-white">
                    Bootstrap Control Panel
                </h2>
                {showForm ? (
                    <>
                        <p className="py-4 text-black">
                            Please select the system you would like to control.
                        </p>
                        <div className="relative w-[calc(100%-2rem)] mb-2">
                            <label
                                htmlFor="system-search"
                                className="absolute -top-2 left-2 bg-white px-2 text-xs text-gray-500"
                            >
                                System ID
                            </label>
                            <input
                                id="system-search"
                                type="text"
                                value={system_id}
                                onChange={(e) => setSystemId(e.target.value)}
                                placeholder="Search for a system..."
                                className="w-full rounded-md border border-gray-300 p-4 focus:border-indigo-500 focus:outline-none  text-black"
                            />
                            {loading === 'search' && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div
                                        className="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                                </div>
                            )}
                        </div>

                        {/* Autocomplete List */}
                        <ul className="w-[calc(100%-2rem)] rounded-md border border-gray-200 bg-white text-left  text-black">
                            {space_list.map((option) => (
                                <li
                                    key={option.id}
                                    onClick={() => setSystemId(option.id)}
                                    className="cursor-pointer p-3 hover:bg-gray-100"
                                >
                                    <div className="flex w-full items-center space-x-4 leading-tight">
                                        <div className="flex flex-1 flex-col">
                                            <div>
                                                {option.display_name ||
                                                    option.name}
                                            </div>
                                            {option.display_name &&
                                                option.display_name !==
                                                option.name && (
                                                    <div className="text-xs opacity-40">
                                                        {option.name}
                                                    </div>
                                                )}
                                        </div>
                                        <div className="rounded bg-gray-200 px-2 py-1 font-mono text-[0.625rem]">
                                            {option.id}
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {system_id.length < 2 &&
                                space_list.length === 0 && (
                                    <li className="pointer-events-none p-3 opacity-30">
                                        Enter 2 or more characters to search
                                    </li>
                                )}
                        </ul>
                        <div className="flex justify-end p-4 w-full">
                            <button
                                className="btn w-32"
                                onClick={bootstrap}
                                disabled={!system_id}
                            >
                                Submit
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="my-16 flex flex-col items-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                        <div className="m-4">Loading Application...</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BootstrapPage;
