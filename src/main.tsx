import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TourHost from "./components/TourHost";
import {ModalProvider} from "./hooks/ModalContext.tsx";
import {HashRouter} from "react-router-dom";
import {AuthProvider} from "./AuthContext.tsx";

const container = document.getElementById('root')
if (container) {
    const root = createRoot(container)
    root.render(
        <React.StrictMode>
            <HashRouter>
                <AuthProvider>
                    <ModalProvider>
                        <TourHost/>
                    </ModalProvider>
                </AuthProvider>
            </HashRouter>
        </React.StrictMode>
    )
}


