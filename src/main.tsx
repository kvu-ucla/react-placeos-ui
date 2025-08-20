import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TourHost from "./components/TourHost";
import {ModalProvider} from "./hooks/ModalContext.tsx";

const container = document.getElementById('root')
if (container) {
    const root = createRoot(container)
    root.render(
        <React.StrictMode>
            <ModalProvider>
                <TourHost/>
            </ModalProvider>
        </React.StrictMode>
    )
}


