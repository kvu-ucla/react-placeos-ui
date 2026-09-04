import { createContext, useContext, useState } from "react";
import type { ModalType, TabSection } from "../models/Modal";

type ModalContextType = {
  showModal: (type: ModalType, options?: { tab?: TabSection }) => void;
  closeModal: () => void;
  modalType: ModalType;
  initialTab?: TabSection;
  /** Bumped on every tab deep-link so an already-open modal can re-sync */
  tabNonce: number;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("ModalContext not available");
  return ctx;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalType, setModalType] = useState<ModalType>("none");
  const [initialTab, setInitialTab] = useState<TabSection>("Volume");
  const [tabNonce, setTabNonce] = useState(0);

  const showModal = (type: ModalType, options?: { tab?: TabSection }) => {
    setModalType(type);
    if (options?.tab) {
      setInitialTab(options.tab);
      // Same-tab deep-links must still register on an already-open modal
      setTabNonce((n) => n + 1);
    }
  };

  const closeModal = () => setModalType("none");

  return (
    <ModalContext.Provider
      value={{ showModal, closeModal, modalType, initialTab, tabNonce }}
    >
      {children}
    </ModalContext.Provider>
  );
}
